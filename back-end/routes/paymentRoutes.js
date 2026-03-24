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

const FINTECH_COURSE_ID = process.env.FINTECH_COURSE_ID || "698dee27e56d0404b2ec951c";

function getPrimaryEmiOffer() {
  return [
    process.env.RAZORPAY_EMI_OFFER_HDFC,
    process.env.RAZORPAY_EMI_OFFER_ICICI,
    process.env.RAZORPAY_EMI_OFFER_AXIS,
    process.env.RAZORPAY_EMI_OFFER_KOTAK,
    process.env.RAZORPAY_EMI_OFFER_BOB,
  ].filter(Boolean)[0] || null;
}

function getAllEmiOffers() {
  return [
    process.env.RAZORPAY_EMI_OFFER_BOB,
    process.env.RAZORPAY_EMI_OFFER_AXIS,
    process.env.RAZORPAY_EMI_OFFER_KOTAK,
    process.env.RAZORPAY_EMI_OFFER_HDFC,
    process.env.RAZORPAY_EMI_OFFER_ICICI,
  ].filter(Boolean);
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
      .trim().notEmpty().withMessage("Course ID is required")
      .isMongoId().withMessage("Invalid course ID format"),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { amount, courseId } = req.body;
      const razorpay = getRazorpay();
      const log = global.logger || console;

      const orderPayload = {
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `r_${Date.now()}`,
        notes: { courseId },
        payment_capture: 1,
      };

      const isFintech = courseId === FINTECH_COURSE_ID;
      const isFullPrice = Math.round(amount) === 30000;
      const primaryOffer = getPrimaryEmiOffer();
      const emiActive = isFintech && isFullPrice && !!primaryOffer;

      if (emiActive) {
        orderPayload.offer_id = primaryOffer;
        log.info(`No Cost EMI offer attached: ${primaryOffer}`);
      }

      const order = await razorpay.orders.create(orderPayload);
      log.info(`Order created: ${order.id} | ₹${amount} | EMI: ${emiActive}`);

      return res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        emiActive,
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
    body("courseId").trim().notEmpty().withMessage("Course ID is required").isMongoId().withMessage("Invalid course ID format"),
    body("amount").isNumeric().withMessage("Amount must be a number").custom((val) => val >= 1).withMessage("Amount must be at least 1"),
    body("razorpay_order_id").trim().notEmpty().withMessage("Razorpay order ID is required"),
    body("razorpay_payment_id").trim().notEmpty().withMessage("Razorpay payment ID is required"),
    body("razorpay_signature").trim().notEmpty().withMessage("Razorpay signature is required"),
    // referralCode is optional
    body("referralCode").optional().trim().isLength({ max: 30 }),
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
        referralCode,
      } = req.body;

      const log = global.logger || console;
      log.info(`Verify — userId: ${userId} | courseId: ${courseId} | paymentId: ${razorpay_payment_id} | referral: ${referralCode || "none"}`);

      // ── HMAC signature verification ──
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        log.error("Signature mismatch — possible tampered request");
        return res.status(400).json({ message: "Payment verification failed: invalid signature" });
      }

      // ── Detect EMI vs one_time ──
      let paymentMethod = "one_time";
      let emiDetails = null;

      try {
        const razorpay = getRazorpay();
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

        if (paymentDetails.method === "emi") {
          paymentMethod = "emi";
          emiDetails = {
            bank: paymentDetails.bank || null,
            tenure: paymentDetails.emi?.tenure || null,
            monthlyAmount: paymentDetails.emi?.installment_amount
              ? Math.round(paymentDetails.emi.installment_amount / 100)
              : null,
            isNoCostEmi: paymentDetails.offer_id
              ? getAllEmiOffers().includes(paymentDetails.offer_id)
              : false,
          };
          log.info(`EMI detected — bank: ${emiDetails.bank} | ${emiDetails.tenure}mo | NoCost: ${emiDetails.isNoCostEmi}`);
        }
      } catch (fetchErr) {
        log.error("Payment fetch failed (non-critical):", fetchErr.message);
      }

      const purchase = await completePurchase({
        userId,
        courseId,
        amount,
        paymentProvider: "razorpay",
        paymentId: razorpay_payment_id,
        paymentMethod,
        emiDetails,
        referralCode: referralCode || null,
      });

      log.info(`Purchase saved: ${purchase._id} | method: ${paymentMethod} | referral: ${referralCode || "none"}`);

      return res.status(201).json({
        message: "Purchase completed successfully",
        purchase,
      });

    } catch (err) {
      const log = global.logger || console;
      if (err.message === "Course already purchased") return res.status(409).json({ message: err.message });
      if (err.message === "Course not found") return res.status(404).json({ message: err.message });
      if (err.message === "User not found in database") return res.status(404).json({ message: err.message });
      log.error("Payment verification error:", err);
      return res.status(500).json({ message: "Payment verification failed" });
    }
  }
);

module.exports = router;