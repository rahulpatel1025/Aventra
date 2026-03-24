const mongoose = require("mongoose");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const Course = require("../models/Course");
const { sendInvoiceEmail, sendBenefitsEmail } = require("./emailService");

async function completePurchase({
  userId,
  courseId,
  amount,
  paymentProvider,
  paymentId,
  paymentMethod = "one_time",
  emiDetails = null,
  referralCode = null,   // e.g. "MINI10", "AVENTRA1000", "AVENTRADEV1"
}) {
  const log = global.logger || console;

  // 1️⃣ Validate courseId
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error("Invalid course ID");
  }

  // 2️⃣ Verify course exists
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");

  // 3️⃣ Verify user exists
  const user = await User.findOne({ clerkId: userId });
  if (!user) throw new Error("User not found in database");

  // 4️⃣ Prevent duplicate purchase
  const existingPurchase = await Purchase.findOne({ userId, courseId: course._id });
  if (existingPurchase) throw new Error("Course already purchased");

  // 5️⃣ Build purchase document
  const purchaseData = {
    userId,
    studentName: user.fullName || null,
    courseId: course._id,
    amount,
    paymentProvider,
    paymentId,
    paymentMethod,
    referralCode: referralCode ? referralCode.toUpperCase() : null,
    status: "completed",
  };

  if (paymentMethod === "emi" && emiDetails) {
    purchaseData.emiDetails = {
      bank: emiDetails.bank || null,
      tenure: emiDetails.tenure || null,
      monthlyAmount: emiDetails.monthlyAmount || null,
      isNoCostEmi: emiDetails.isNoCostEmi || false,
    };
  }

  const purchase = await Purchase.create(purchaseData);
  log.info(`Purchase saved: ${purchase._id} | student: ${user.fullName} | method: ${paymentMethod} | referral: ${referralCode || "none"}`);

  // 6️⃣ Update user dashboard
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
    log.error("User update failed (non-critical):", err);
  }

  // 7️⃣ Send invoice email (non-blocking)
  try {
    if (user.email) {
      await sendInvoiceEmail({
        toEmail: user.email,
        studentName: user.fullName || "Student",
        courseName: course.title || course.name || "Your Course",
        amount,
        paymentId,
        purchaseDate: purchase.createdAt,
        paymentMethod,
        emiDetails: paymentMethod === "emi" ? purchaseData.emiDetails : null,
        referralCode,
      });
    }
  } catch (emailErr) {
    log.error("Invoice email failed (non-critical):", emailErr.message);
  }

  // 8️⃣ Send MINI10 benefits email if that referral code was used
  // Runs after invoice email — completely separate, non-blocking
  try {
    if (
      referralCode &&
      referralCode.toUpperCase() === "MINI10" &&
      user.email
    ) {
      await sendBenefitsEmail({
        toEmail: user.email,
        studentName: user.fullName || "Student",
        courseName: course.title || course.name || "Your Course",
      });
      log.info(`MINI10 benefits email sent to ${user.email}`);
    }
  } catch (benefitsErr) {
    log.error("Benefits email failed (non-critical):", benefitsErr.message);
  }

  return purchase;
}

module.exports = { completePurchase };