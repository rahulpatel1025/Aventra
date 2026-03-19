const mongoose = require("mongoose");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const Course = require("../models/Course");
const { sendInvoiceEmail } = require("./emailService");

async function completePurchase({
  userId,
  courseId,
  amount,
  paymentProvider,
  paymentId,
}) {

  // 1️⃣ Validate courseId format
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
    courseId: course._id,
  });

  if (existingPurchase) {
    throw new Error("Course already purchased");
  }

  // 5️⃣ Create purchase record
  const purchase = await Purchase.create({
    userId,
    courseId: course._id,
    amount,
    paymentProvider,
    paymentId,
    status: "completed",
  });
  console.log("✅ Purchase saved to MongoDB:", purchase._id); // ADD THIS
console.log("✅ Updating user:", userId);                   // ADD THIS

  // 6️⃣ Update user dashboard safely
  try {
    await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $addToSet: { purchasedCourses: course._id },
        $set: { hasPurchased: true },
        $inc: { coursesEnrolled: 1 },
      },
      { new: true }
    );
  } catch (err) {
    console.error("User update failed:", err);
    // Don't throw — purchase is already saved, user update failure is non-critical
  }

  // 7️⃣ Send invoice email (non-blocking — never fails the purchase)
  try {
    if (user.email) {
      await sendInvoiceEmail({
        toEmail: user.email,
        studentName: user.fullName || "Student",
        courseName: course.title || course.name || "Your Course",
        amount,
        paymentId,
        purchaseDate: purchase.createdAt,
      });
    }
  } catch (emailErr) {
    console.error("Invoice email failed (non-critical):", emailErr.message);
    // Never block the purchase flow for email failures
  }

  return purchase;
}

module.exports = { completePurchase };