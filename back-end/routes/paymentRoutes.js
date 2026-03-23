const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { requireAuth } = require("@clerk/express");
const { body, validationResult } = require("express-validator");
const { completePurchase } = require("../services/purchaseService");

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return null;
}

// ================= CREATE ORDER =================
router.post(
  "/create-order",
  requireAuth(),
  [
    body("amount")
      .isNumeric().withMessage("Amount must be a number")
      .custom((val) => val >= 1).withMessage("Amount must be at least ₹1"),
    body("courseId")
      .trim()
      .notEmpty().withMessage("Course ID is required")
      .isMongoId().withMessage("Invalid course ID format"),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { amount, courseId } = req.body;
      const razorpay = getRazorpay();

      const orderPayload = {
        amount: Math.round(amount * 100), // paise
        currency: "INR",
        receipt: `r_${Date.now()}`,
        notes: { courseId },
        // payment_capture: 1 ensures auto-capture — required for EMI flows
        payment_capture: 1,
      };

      // ── EMI-specific: only add method config when amount >= ₹3000 ──
      // Razorpay requires the order to be >= ₹3000 for EMI to be offered
      // Adding this to orders below ₹3000 causes a Razorpay API error
      if (amount >= 3000) {
        orderPayload.method_options = {
          emi: {
            enabled: true,
          },
        };
      }

      const order = await razorpay.orders.create(orderPayload);

      const log = global.logger || console;
      log.info(`Order created: ${order.id} | amount: ₹${amount} | EMI: ${amount >= 3000}`);

      return res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });

    } catch (err) {
      const log = global.logger || console;
      log.error("Razorpay order creation error:", err);
      return res.status(500).json({ message: "Failed to create payment order" });
    }
  }
);

// ================= VERIFY PAYMENT =================
router.post(
  "/verify",
  [
    body("courseId")
      .trim().notEmpty().withMessage("Course ID is required")
      .isMongoId().withMessage("Invalid course ID format"),
    body("amount")
      .isNumeric().withMessage("Amount must be a number")
      .custom((val) => val >= 1).withMessage("Amount must be at least 1"),
    body("razorpay_order_id")
      .trim().notEmpty().withMessage("Razorpay order ID is required"),
    body("razorpay_payment_id")
      .trim().notEmpty().withMessage("Razorpay payment ID is required"),
    body("razorpay_signature")
      .trim().notEmpty().withMessage("Razorpay signature is required"),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const authData = typeof req.auth === "function" ? req.auth() : req.auth;
      const userId = authData?.userId;

      if (!userId) return res.status(401).json({ message: "Unauthorized user" });

      const {
        courseId, amount,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      const log = global.logger || console;
      log.info(`Verify — userId: ${userId} | courseId: ${courseId} | paymentId: ${razorpay_payment_id}`);

      // ── HMAC signature verification ──
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        log.error("Signature mismatch — possible tampered request");
        return res.status(400).json({ message: "Payment verification failed: invalid signature" });
      }

      const purchase = await completePurchase({
        userId,
        courseId,
        amount,
        paymentProvider: "razorpay",
        paymentId: razorpay_payment_id,
      });

      log.info(`Purchase saved: ${purchase._id}`);
      return res.status(201).json({ message: "Purchase completed successfully", purchase });

    } catch (err) {
      const log = global.logger || console;
      if (err.message === "Course already purchased")
        return res.status(409).json({ message: err.message });
      if (err.message === "Course not found")
        return res.status(404).json({ message: err.message });
      if (err.message === "User not found in database")
        return res.status(404).json({ message: err.message });

      log.error("Payment verification error:", err);
      return res.status(500).json({ message: "Payment verification failed" });
    }
  }
);

module.exports = router;