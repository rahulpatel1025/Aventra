const Purchase = require("../models/Purchase");
const User = require("../models/User");
const Course = require("../models/Course");

async function completePurchase({
  userId, // Note: This is the Clerk ID (e.g., user_2...)
  courseId,
  amount,
  paymentProvider,
  paymentId,
}) {
  // 1️⃣ Validate course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error("Course not found");
  }

  // 2️⃣ Verify user exists in DB using clerkId
  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    throw new Error("User not found in database");
  }

  // 3️⃣ Prevent duplicate purchase
  const existing = await Purchase.findOne({
    userId, // Storing the Clerk ID
    courseId,
  });

  if (existing) {
    throw new Error("Course already purchased");
  }

  // 4️⃣ Create purchase record
  const purchase = await Purchase.create({
    userId,
    courseId,
    amount,
    paymentProvider,
    paymentId,
    status: "completed",
  });

  // 5️⃣ Attach course & unlock dashboard features for the user
  await User.findOneAndUpdate(
    { clerkId: userId }, // Find by Clerk ID, NOT Mongo _id
    {
      $addToSet: { purchasedCourses: courseId }, // Adds course (prevents duplicates)
      $set: { hasPurchased: true },              // Unlocks the FinTech Quiz!
      $inc: { coursesEnrolled: 1 }               // Updates the stats counter
    },
    { new: true }
  );

  return purchase;
}

module.exports = { completePurchase };