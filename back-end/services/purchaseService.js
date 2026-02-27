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
  // 1️⃣ Validate course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error("Course not found");
  }

  // 2️⃣ Prevent duplicate purchase
  const existing = await Purchase.findOne({
    userId,
    courseId,
  });

  if (existing) {
    throw new Error("Course already purchased");
  }

  // 3️⃣ Create purchase record
  const purchase = await Purchase.create({
    userId,
    courseId,
    amount,
    paymentProvider,
    paymentId,
    status: "completed",
  });

  // 4️⃣ Attach course to user
  await User.findByIdAndUpdate(userId, {
    $addToSet: { purchasedCourses: courseId },
  });

  return purchase;
}

module.exports = { completePurchase };
    