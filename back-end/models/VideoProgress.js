const mongoose = require("mongoose");

const videoProgressSchema = new mongoose.Schema(
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

    // The S3 key or video identifier — e.g. "FT01", "FT02"
    videoId: {
      type: String,
      required: true,
    },

    // Order index of this video in the course (0-based)
    videoIndex: {
      type: Number,
      required: true,
    },

    completed: {
      type: Boolean,
      default: false,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // How far through the video the student has watched (0–100)
    watchPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Total seconds watched (for analytics)
    watchedSeconds: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index — one record per user per video per course
videoProgressSchema.index({ userId: 1, courseId: 1, videoId: 1 }, { unique: true });

// Compound index for fast "get all progress for a user in a course" query
videoProgressSchema.index({ userId: 1, courseId: 1 });

module.exports = mongoose.model("VideoProgress", videoProgressSchema);