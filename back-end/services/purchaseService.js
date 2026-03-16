const mongoose = require("mongoose");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const Course = require("../models/Course");

async function completePurchase({
  userId,
  courseId,
  amount,
  paymentProvider,
  paymentId,
}) {

  // 1️⃣ Validate courseId format first
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error("Invalid course ID");
  }

  // 2️⃣ Verify course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error("Course not found");
  }

  // 3️⃣ Verify user exists
  const user = await User.findOne({ clerkId: userId });

  if (!user) {
    throw new Error("User not found in database");
  }

  // 4️⃣ Prevent duplicate purchase
  const existingPurchase = await Purchase.findOne({
    userId,
    courseId: new mongoose.Types.ObjectId(courseId),
  });

  if (existingPurchase) {
    throw new Error("Course already purchased");
  }

  // 5️⃣ Create purchase record
  const purchase = await Purchase.create({
    userId,
    courseId: new mongoose.Types.ObjectId(courseId),
    amount,
    paymentProvider,
    paymentId,
    status: "completed",
  });

  // 6️⃣ Update user dashboard
  await User.findOneAndUpdate(
    { clerkId: userId },
    {
      $addToSet: {
        purchasedCourses: new mongoose.Types.ObjectId(courseId),
      },
      $set: { hasPurchased: true },
      $inc: { coursesEnrolled: 1 },
    }
  );

  return purchase;
}

module.exports = { completePurchase };