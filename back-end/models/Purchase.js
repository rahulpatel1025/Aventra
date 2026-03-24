const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Clerk ID
      required: true,
      index: true,
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
      type: String, // Razorpay payment ID
      required: true,
    },

    // ── How the student paid ──
    // "one_time"  → full ₹30,000 paid upfront
    // "emi"       → paid via EMI (No Cost EMI or regular EMI)
    paymentMethod: {
      type: String,
      enum: ["one_time", "emi"],
      default: "one_time",
    },

    // ── EMI details (populated only when paymentMethod === "emi") ──
    emiDetails: {
      bank: { type: String, default: null },      // e.g. "HDFC", "ICICI"
      tenure: { type: Number, default: null },    // e.g. 6 (months)
      monthlyAmount: { type: Number, default: null }, // e.g. 5000
      isNoCostEmi: { type: Boolean, default: false },
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