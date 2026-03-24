const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Clerk ID
      required: true,
      index: true,
    },

    // ── Student name stored directly for easy admin queries ──
    studentName: {
      type: String,
      default: null,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentProvider: {
      type: String,
      enum: ["stripe", "razorpay"],
      required: true,
    },

    paymentId: {
      type: String,
      required: true,
    },

    // "one_time" → full upfront payment
    // "emi"      → paid via EMI
    paymentMethod: {
      type: String,
      enum: ["one_time", "emi"],
      default: "one_time",
    },

    emiDetails: {
      bank: { type: String, default: null },
      tenure: { type: Number, default: null },
      monthlyAmount: { type: Number, default: null },
      isNoCostEmi: { type: Boolean, default: false },
    },

    // ── Referral code used at checkout (null if none) ──
    referralCode: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);