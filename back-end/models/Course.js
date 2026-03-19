const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    thumbnail: {
      type: String,
    },

    category: {
      type: String,
      index: true,
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    features: {
     type: [String],
     default: [],
     },

    isPublished: {
      type: Boolean,
      default: false, // admin controls this
      index: true,
    },

    totalLessons: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: String, // clerkId of admin
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
