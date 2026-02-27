const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const User = require("../models/User");
const { requireAuth } = require("@clerk/express");
const requireAdmin = require("../middleware/requireAdmin");
const requireCourseAccess = require("../middleware/requireCourseAccess");


// ================= ADMIN ROUTES =================

// ✅ Admin: Create course
router.post("/create", requireAdmin, async (req, res) => {
  try {
    const course = await Course.create({
      ...req.body,
      createdBy: req.user.clerkId,
    });

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Admin: Publish course
router.patch("/publish/:id", requireAdmin, async (req, res) => {
  try {
    await Course.findByIdAndUpdate(req.params.id, {
      isPublished: true,
    });

    res.json({ message: "Course published" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= PUBLIC ROUTES =================

// ✅ Get all published courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= STUDENT ROUTES =================

// ✅ Get logged-in user's purchased courses
router.get("/my-courses", requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth();

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const courses = await Course.find({
      _id: { $in: user.purchasedCourses },
    });

    res.json(courses);
  } catch (err) {
    console.error("My courses error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// 🔐 Protected course access (must be last)
router.get("/:slug", requireAuth(), requireCourseAccess, (req, res) => {
  res.json(req.course);
});


module.exports = router;
