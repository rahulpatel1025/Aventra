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
  paymentMethod = "one_time", // "one_time" | "emi"
  emiDetails = null,           // { bank, tenure, monthlyAmount, isNoCostEmi }
}) {
  const log = global.logger || console;

  // 1️⃣ Validate courseId format
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
    courseId: course._id,
    amount,
    paymentProvider,
    paymentId,
    paymentMethod,
    status: "completed",
  };

  // Attach EMI details only when payment is via EMI
  if (paymentMethod === "emi" && emiDetails) {
    purchaseData.emiDetails = {
      bank: emiDetails.bank || null,
      tenure: emiDetails.tenure || null,
      monthlyAmount: emiDetails.monthlyAmount || null,
      isNoCostEmi: emiDetails.isNoCostEmi || false,
    };
  }

  const purchase = await Purchase.create(purchaseData);
  log.info(`Purchase saved: ${purchase._id} | method: ${paymentMethod}`);

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
      });
    }
  } catch (emailErr) {
    log.error("Invoice email failed (non-critical):", emailErr.message);
  }

  return purchase;
}

module.exports = { completePurchase };