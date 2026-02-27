const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");

const QuizResult = require("../models/QuizResult");
const User = require("../models/User");

const PASS_PERCENTAGE = 75;
const MAX_ATTEMPTS = 3;


// ================= SUBMIT QUIZ =================
router.post("/submit", requireAuth(), async (req, res) => {
  try {

    const { userId } = req.auth();
    const { courseId, score, totalQuestions } = req.body;

    if (!courseId || score == null || !totalQuestions) {
      return res.status(400).json({
        message: "Missing required quiz data",
      });
    }

    const passingScore = Math.ceil(
      (PASS_PERCENTAGE / 100) * totalQuestions
    );

    const passed = score >= passingScore;

    let result = await QuizResult.findOne({ userId, courseId });


    // ================= EXISTING RESULT =================
    if (result) {

      // Already passed → block retake
      if (result.passed) {
        return res.status(400).json({
          message: "Quiz already passed",
          result,
        });
      }

      // Max attempts reached
      if (result.attemptsUsed >= MAX_ATTEMPTS) {
        return res.status(403).json({
          message: "Maximum attempts reached",
          result,
        });
      }

      result.attemptsUsed += 1;
      result.score = score;
      result.passed = passed;
      result.completedAt = new Date();

      await result.save();

    }

    // ================= FIRST ATTEMPT =================
    else {

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


    // ================= UPDATE USER MODEL =================

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


    res.json({
      message: passed
        ? "Quiz passed successfully"
        : "Quiz submitted",
      result,
    });

  } catch (err) {

    console.error("Quiz submit error:", err);

    res.status(500).json({
      message: "Server error",
    });

  }
});


// ================= GET QUIZ RESULT =================
router.get("/result/:courseId", requireAuth(), async (req, res) => {

  try {

    const { userId } = req.auth();
    const { courseId } = req.params;

    const result = await QuizResult.findOne({
      userId,
      courseId,
    });

    res.json(result);

  } catch (err) {

    console.error("Quiz result error:", err);

    res.status(500).json({
      message: "Server error",
    });

  }

});


module.exports = router;