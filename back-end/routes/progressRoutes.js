const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const { body, param, query, validationResult } = require("express-validator");
const VideoProgress = require("../models/VideoProgress");
const User = require("../models/User");
const Course = require("../models/Course");

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return null;
}

// Helper — verify user has purchased this course
async function verifyEnrollment(userId, courseId) {
  const user = await User.findOne({ clerkId: userId });
  if (!user) return false;
  if (user.role === "superadmin") return true;
  return user.purchasedCourses.some((id) => id.toString() === courseId);
}

// ── POST /api/progress/complete ──
// Called by frontend when a video finishes
router.post(
  "/complete",
  requireAuth(),
  [
    body("courseId").isMongoId().withMessage("Invalid courseId"),
    body("videoId").trim().notEmpty().withMessage("videoId is required"),
    body("videoIndex").isInt({ min: 0 }).withMessage("videoIndex must be a non-negative integer"),
    body("watchPercent").optional().isFloat({ min: 0, max: 100 }),
    body("watchedSeconds").optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { userId } = req.auth();
      const { courseId, videoId, videoIndex, watchPercent = 100, watchedSeconds = 0 } = req.body;

      const enrolled = await verifyEnrollment(userId, courseId);
      if (!enrolled) {
        return res.status(403).json({ error: "Not enrolled in this course" });
      }

      // Upsert progress record
      const progress = await VideoProgress.findOneAndUpdate(
        { userId, courseId, videoId },
        {
          $set: {
            videoIndex,
            completed: true,
            completedAt: new Date(),
            watchPercent: Math.min(watchPercent, 100),
          },
          $max: { watchedSeconds },
        },
        { upsert: true, new: true }
      );

      const log = global.logger || console;
      log.info(`Video completed: userId=${userId} courseId=${courseId} videoId=${videoId}`);

      res.json({ success: true, progress });
    } catch (err) {
      const log = global.logger || console;
      log.error("Progress complete error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ── POST /api/progress/heartbeat ──
// Called periodically while video is playing (every 10s)
// Updates watchPercent without marking complete
router.post(
  "/heartbeat",
  requireAuth(),
  [
    body("courseId").isMongoId().withMessage("Invalid courseId"),
    body("videoId").trim().notEmpty().withMessage("videoId is required"),
    body("videoIndex").isInt({ min: 0 }),
    body("watchPercent").isFloat({ min: 0, max: 100 }),
    body("watchedSeconds").optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { userId } = req.auth();
      const { courseId, videoId, videoIndex, watchPercent, watchedSeconds = 0 } = req.body;

      const enrolled = await verifyEnrollment(userId, courseId);
      if (!enrolled) return res.status(403).json({ error: "Not enrolled" });

      await VideoProgress.findOneAndUpdate(
        { userId, courseId, videoId },
        {
          $set: { videoIndex, watchPercent: Math.min(watchPercent, 100) },
          $max: { watchedSeconds },
          $setOnInsert: { completed: false },
        },
        { upsert: true }
      );

      res.json({ success: true });
    } catch (err) {
      const log = global.logger || console;
      log.error("Heartbeat error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ── GET /api/progress/:courseId ──
// Returns all video progress for a user in a course
router.get(
  "/:courseId",
  requireAuth(),
  [param("courseId").isMongoId().withMessage("Invalid courseId")],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { userId } = req.auth();
      const { courseId } = req.params;

      const enrolled = await verifyEnrollment(userId, courseId);
      if (!enrolled) return res.status(403).json({ error: "Not enrolled" });

      const progressRecords = await VideoProgress.find({ userId, courseId }).sort({ videoIndex: 1 });

      // Calculate overall course completion %
      const course = await Course.findById(courseId).select("totalLessons");
      const total = course?.totalLessons || progressRecords.length || 1;
      const completed = progressRecords.filter((p) => p.completed).length;
      const coursePercent = Math.round((completed / total) * 100);

      res.json({
        progress: progressRecords,
        summary: {
          completed,
          total,
          coursePercent,
        },
      });
    } catch (err) {
      const log = global.logger || console;
      log.error("Get progress error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ── GET /api/progress/all/summary ──
// Dashboard — returns progress summary for ALL purchased courses
router.get(
  "/all/summary",
  requireAuth(),
  async (req, res) => {
    try {
      const { userId } = req.auth();

      const user = await User.findOne({ clerkId: userId }).populate("purchasedCourses", "title totalLessons");
      if (!user) return res.status(404).json({ error: "User not found" });

      const summaries = await Promise.all(
        user.purchasedCourses.map(async (course) => {
          const completed = await VideoProgress.countDocuments({
            userId,
            courseId: course._id,
            completed: true,
          });
          const total = course.totalLessons || 1;
          return {
            courseId: course._id,
            title: course.title,
            completed,
            total,
            percent: Math.round((completed / total) * 100),
          };
        })
      );

      res.json({ summaries });
    } catch (err) {
      const log = global.logger || console;
      log.error("Progress summary error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;