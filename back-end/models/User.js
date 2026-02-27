const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true, // fast login lookup
    },

    fullName: {
      type: String,
      index: true,
    },

    email: {
      type: String,
      index: true,
    },

    profileImage: {
      type: String,
    },

    // ================= ROLE SYSTEM =================
    role: {
      type: String,
      enum: ["student", "admin", "superadmin"],
      default: "student",
      index: true,
    },

    // ================= DASHBOARD STATS =================
    coursesEnrolled: {
      type: Number,
      default: 0,
    },

    completedCourses: {
      type: Number,
      default: 0,
    },

    internshipProgress: {
      type: Number,
      default: 0,
    },

    certificates: {
      type: Number,
      default: 0,
    },

    // ================= PURCHASE ACCESS =================
    hasPurchased: {
      type: Boolean,
      default: false,
      index: true,
    },

    purchasedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    // ================= QUIZ SYSTEM =================

    quizAttempts: {
      type: Number,
      default: 0,
    },

    quizScore: {
      type: Number,
      default: 0,
    },

    quizPassed: {
      type: Boolean,
      default: false,
      index: true,
    },

    quizCompletedAt: {
      type: Date,
      default: null,
    },

  },
  {
    timestamps: true,
  }
);

// Ensure indexes auto-create
userSchema.set("autoIndex", true);

module.exports = mongoose.model("User", userSchema);