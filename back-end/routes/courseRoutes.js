const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const { body, param, validationResult } = require("express-validator");
const Course = require("../models/Course");
const User = require("../models/User");
const requireAdmin = require("../middleware/requireAdmin");
const requireCourseAccess = require("../middleware/requireCourseAccess");

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return null;
}

// ================= ADMIN ROUTES =================

// ── POST /api/courses/create ──
router.post(
  "/create",
  requireAdmin,
  [
    body("title")
      .trim()
      .notEmpty().withMessage("Course title is required")
      .isLength({ max: 200 }).withMessage("Title too long"),

    body("slug")
      .trim()
      .notEmpty().withMessage("Slug is required")
      .matches(/^[a-z0-9-]+$/).withMessage("Slug must be lowercase letters, numbers and hyphens only"),

    body("description")
      .trim()
      .notEmpty().withMessage("Description is required")
      .isLength({ max: 2000 }).withMessage("Description too long"),

    body("price")
      .isNumeric().withMessage("Price must be a number")
      .custom((val) => val >= 0).withMessage("Price cannot be negative"),

    body("level")
      .optional()
      .isIn(["beginner", "intermediate", "advanced"]).withMessage("Level must be beginner, intermediate or advanced"),

    body("category")
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage("Category too long"),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const course = await Course.create({
        ...req.body,
        createdBy: req.user.clerkId,
      });

      const log = global.logger || console;
      log.info(`Course created: ${course.title} (${course._id})`);
      res.status(201).json(course);
    } catch (err) {
      const log = global.logger || console;
      // Handle duplicate slug
      if (err.code === 11000) {
        return res.status(409).json({ error: "A course with this slug already exists" });
      }
      log.error("Course create error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ── PATCH /api/courses/publish/:id ──
router.patch(
  "/publish/:id",
  requireAdmin,
  [
    param("id").isMongoId().withMessage("Invalid course ID format"),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { isPublished: true },
        { new: true }
      );

      if (!course) return res.status(404).json({ message: "Course not found" });

      const log = global.logger || console;
      log.info(`Course published: ${course.title} (${course._id})`);
      res.json({ message: "Course published", course });
    } catch (err) {
      const log = global.logger || console;
      log.error("Course publish error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ================= PUBLIC ROUTES =================

// ── GET /api/courses ──
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).select("-__v");
    res.json(courses);
  } catch (err) {
    const log = global.logger || console;
    log.error("Courses fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= STUDENT ROUTES =================

// ── GET /api/courses/my-courses ──
router.get("/my-courses", requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth();

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const courses = await Course.find({
      _id: { $in: user.purchasedCourses },
    }).select("-__v");

    res.json(courses);
  } catch (err) {
    const log = global.logger || console;
    log.error("My courses error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/courses/:slug — protected course access (must be last) ──
router.get(
  "/:slug",
  requireAuth(),
  requireCourseAccess,
  (req, res) => {
    res.json(req.course);
  }
);

module.exports = router;