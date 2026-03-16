const express = require("express");
const router = express.Router();
const { completePurchase } = require("../services/purchaseService");
const { requireAuth } = require("@clerk/express");

router.post("/verify", requireAuth(), async (req, res) => {
  try {

    // Extract Clerk auth safely
    const authData = typeof req.auth === "function" ? req.auth() : req.auth;
    const userId = authData?.userId;

    const { courseId, amount, paymentProvider, paymentId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    if (!courseId || !paymentProvider || !paymentId) {
      return res.status(400).json({ message: "Missing payment data" });
    }

    const purchase = await completePurchase({
      userId,
      courseId,
      amount,
      paymentProvider,
      paymentId,
    });

    return res.status(201).json({
      message: "Purchase completed successfully",
      purchase,
    });

  } catch (err) {

    // Handle duplicate purchase properly
    if (err.message === "Course already purchased") {
      return res.status(409).json({ message: err.message });
    }

    // Handle missing course
    if (err.message === "Course not found") {
      return res.status(404).json({ message: err.message });
    }

    // Handle missing user
    if (err.message === "User not found in database") {
      return res.status(404).json({ message: err.message });
    }

    console.error("Payment Verification Error:", err);
    return res.status(500).json({ message: "Payment verification failed" });
  }
});

module.exports = router;