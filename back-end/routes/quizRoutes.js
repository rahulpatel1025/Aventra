const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const { body, param, validationResult } = require("express-validator");
const QuizResult = require("../models/QuizResult");
const User = require("../models/User");

const PASS_PERCENTAGE = 75;
const MAX_ATTEMPTS = 3;

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return null;
}

// ================= SUBMIT QUIZ =================
router.post(
  "/submit",
  requireAuth(),
  [
    body("courseId")
      .trim()
      .notEmpty().withMessage("Course ID is required")
      .isMongoId().withMessage("Invalid course ID format"),

    body("score")
      .isInt({ min: 0 }).withMessage("Score must be a non-negative integer"),

    body("totalQuestions")
      .isInt({ min: 1 }).withMessage("Total questions must be at least 1"),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const log = global.logger || console;

    try {
      const { userId } = req.auth();
      const { courseId, score, totalQuestions } = req.body;

      // Extra sanity check — score can't exceed total
      if (score > totalQuestions) {
        return res.status(400).json({ message: "Score cannot exceed total questions" });
      }

      const passingScore = Math.ceil((PASS_PERCENTAGE / 100) * totalQuestions);
      const passed = score >= passingScore;

      let result = await QuizResult.findOne({ userId, courseId });

      if (result) {
        if (result.passed) {
          return res.status(400).json({ message: "Quiz already passed", result });
        }
        if (result.attemptsUsed >= MAX_ATTEMPTS) {
          return res.status(403).json({ message: "Maximum attempts reached", result });
        }

        result.attemptsUsed += 1;
        result.score = score;
        result.passed = passed;
        result.completedAt = new Date();
        await result.save();

      } else {
        result = await QuizResult.create({
          userId,
          courseId,
          score,
          totalQuestions,
          passed,
          attemptsUsed: 1,
          maxAttempts: MAX_ATTEMPTS,
          completedAt: new Date(),
        });
      }

      // ── Update user model ──
      const user = await User.findOne({ clerkId: userId });
      if (user) {
        user.quizAttempts = result.attemptsUsed;
        user.quizScore = score;
        user.quizPassed = passed;
        if (passed && !user.quizCompletedAt) {
          user.quizCompletedAt = new Date();
        }
        await user.save();
      }

      log.info(`Quiz submitted — userId: ${userId} | score: ${score}/${totalQuestions} | passed: ${passed}`);

      res.json({
        message: passed ? "Quiz passed successfully" : "Quiz submitted",
        result,
      });

    } catch (err) {
      log.error("Quiz submit error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ================= GET QUIZ RESULT =================
router.get(
  "/result/:courseId",
  requireAuth(),
  [
    param("courseId")
      .isMongoId().withMessage("Invalid course ID format"),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const log = global.logger || console;

    try {
      const { userId } = req.auth();
      const { courseId } = req.params;

      const result = await QuizResult.findOne({ userId, courseId });
      res.json(result);

    } catch (err) {
      log.error("Quiz result fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;