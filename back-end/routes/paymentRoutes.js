const express = require("express");
const router = express.Router();
const { completePurchase } = require("../services/purchaseService");
const { requireAuth } = require("@clerk/express");

router.post("/verify", requireAuth(), async (req, res) => {
  try {
    // Safely extract Clerk auth data
    const authData = typeof req.auth === "function" ? req.auth() : req.auth;
    const userId = authData?.userId;

    const { courseId, amount, paymentProvider, paymentId } = req.body;

    if (!userId || !courseId || !paymentProvider || !paymentId) {
      return res.status(400).json({ message: "Missing payment data" });
    }

    const purchase = await completePurchase({
      userId,
      courseId,
      amount,
      paymentProvider,
      paymentId,
    });

    res.status(201).json({
      message: "Purchase completed successfully",
      purchase,
    });

  } catch (err) {
    console.error("Payment Verification Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;