const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
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
    },

    score: {
      type: Number,
      required: true,
    },

    totalQuestions: {
      type: Number,
      required: true,
    },

    passed: {
      type: Boolean,
      default: false,
    },

    attemptsUsed: {
      type: Number,
      default: 1,
    },

    maxAttempts: {
      type: Number,
      default: 3,
    },

    certificateIssued: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizResult", quizResultSchema);