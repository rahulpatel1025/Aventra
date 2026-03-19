const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { requireAuth } = require("@clerk/express");
const { completePurchase } = require("../services/purchaseService");

// ================= RAZORPAY INSTANCE =================
// Initialized lazily inside routes so env vars are guaranteed to be loaded
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ================= STEP 1: CREATE ORDER =================
// Frontend calls this first to get an order_id from Razorpay
router.post("/create-order", requireAuth(), async (req, res) => {
  try {
    const { amount, courseId } = req.body;

    if (!amount || !courseId) {
      return res.status(400).json({ message: "Amount and courseId are required" });
    }

    const razorpay = getRazorpay();

    // Receipt must be under 40 characters
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `r_${Date.now()}`,
      notes: { courseId },
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error("Razorpay order creation error:", err);
    return res.status(500).json({ message: "Failed to create payment order" });
  }
});

// ================= STEP 2: VERIFY & COMPLETE =================
// requireAuth() removed — clerkMiddleware in index.js already processes
// the Authorization header. requireAuth() causes conflicts inside the
// Razorpay handler callback context and throws a 500.
router.post("/verify", async (req, res) => {
  try {
    const authData = typeof req.auth === "function" ? req.auth() : req.auth;
    const userId = authData?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const {
      courseId,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    console.log("🔍 Verify called for userId:", userId, "| courseId:", courseId, "| paymentId:", razorpay_payment_id);

    if (!courseId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification data" });
    }

    // ── Verify Razorpay signature (CRITICAL security check) ──
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Signature mismatch — possible tampered request");
      return res.status(400).json({ message: "Payment verification failed: invalid signature" });
    }

    const purchase = await completePurchase({
      userId,
      courseId,
      amount,
      paymentProvider: "razorpay",
      paymentId: razorpay_payment_id,
    });

    console.log("✅ Purchase saved:", purchase._id);

    return res.status(201).json({
      message: "Purchase completed successfully",
      purchase,
    });

  } catch (err) {
    if (err.message === "Course already purchased") {
      return res.status(409).json({ message: err.message });
    }
    if (err.message === "Course not found") {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === "User not found in database") {
      return res.status(404).json({ message: err.message });
    }

    console.error("Payment Verification Error:", err);
    return res.status(500).json({ message: "Payment verification failed" });
  }
});

module.exports = router;