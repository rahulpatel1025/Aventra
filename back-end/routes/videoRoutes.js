const express = require("express");
const router = express.Router();
// 👈 Axios import completely removed!
const { requireAuth } = require("@clerk/express");
const { param, query, validationResult } = require("express-validator");
const User = require("../models/User");
const VideoProgress = require("../models/VideoProgress");

// ── CloudFront config from env ──
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN; 

// ── FinTech course video catalogue ──
const FINTECH_VIDEOS = [
  { videoId: "FT01", index: 0, title: "Introduction to FinTech & Digital Platforms" },
  { videoId: "FT02", index: 1, title: "Digital Payment Systems" },
  { videoId: "FT03", index: 2, title: "Banking APIs & Open Banking" },
  { videoId: "FT04", index: 3, title: "Blockchain & Cryptocurrency Fundamentals" },
  { videoId: "FT05", index: 4, title: "RegTech & Compliance Automation" },
  { videoId: "FT06", index: 5, title: "InsurTech & Lending Platforms" },
  { videoId: "FT07", index: 6, title: "Digital Wallets & UPI Architecture" },
  { videoId: "FT08", index: 7, title: "Risk Management & Fraud Detection" },
  { videoId: "FT09", index: 8, title: "FinTech Product Design & UX" },
  { videoId: "FT10", index: 9, title: "Capstone: Building a FinTech Product" },
];

const FINTECH_COURSE_ID = process.env.FINTECH_COURSE_ID; 

function getVideoCatalogue(courseId) {
  if (courseId === FINTECH_COURSE_ID) return FINTECH_VIDEOS;
  return null;
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  return null;
}

async function verifyEnrollment(userId, courseId) {
  const user = await User.findOne({ clerkId: userId });
  if (!user) return false;
  if (user.role === "superadmin") return true;
  return user.purchasedCourses.some((id) => id.toString() === courseId);
}

// ── GET /api/videos/catalogue/:courseId ──
router.get("/catalogue/:courseId", requireAuth(), [param("courseId").isMongoId().withMessage("Invalid courseId")], async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { userId } = req.auth();
    const { courseId } = req.params;

    if (!(await verifyEnrollment(userId, courseId))) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    const catalogue = getVideoCatalogue(courseId);
    if (!catalogue) return res.status(404).json({ error: "Course video catalogue not found" });

    const progressRecords = await VideoProgress.find({ userId, courseId });
    const progressMap = {};
    progressRecords.forEach((p) => { progressMap[p.videoId] = p; });

    const videos = catalogue.map((video, i) => {
      const progress = progressMap[video.videoId];
      const previousCompleted = i === 0 ? true : progressMap[catalogue[i - 1].videoId]?.completed;
      return { 
        ...video, 
        isLocked: !previousCompleted, 
        completed: progress?.completed || false, 
        watchPercent: progress?.watchPercent || 0 
      };
    });

    res.json({ videos });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/videos/set-cookies (Using AWS Lambda & Native Fetch) ──
router.get("/set-cookies", requireAuth(), [
  query("courseId").isMongoId().withMessage("Invalid courseId"),
  query("videoId").trim().notEmpty().withMessage("videoId is required"),
  query("quality").optional().isIn(["1080p", "720p", "360p"]).withMessage("Invalid quality"),
], async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { userId } = req.auth();
    const { courseId, videoId, quality = "720p" } = req.query;

    if (!(await verifyEnrollment(userId, courseId))) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    // 1. Native Fetch to AWS Lambda (No Axios needed!)
    const lambdaResponse = await fetch(process.env.LAMBDA_SIGNER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: videoId })
    });

    if (!lambdaResponse.ok) {
      throw new Error(`Lambda returned status ${lambdaResponse.status}`);
    }

    // Lambda hands us back the exact cookies we need
    const data = await lambdaResponse.json();
    const { policy, signature, keyPairId, domain } = data;

    // 2. Set the cookies on the user's browser
    const cookieOptions = {
      domain: ".aventratechsolution.com", // Works on main site and CDN
      path: "/",
      httpOnly: false, // Must be false so React/HLS can read them
      secure: true,
      sameSite: "none",
    };

    res.cookie("CloudFront-Policy", policy, cookieOptions);
    res.cookie("CloudFront-Signature", signature, cookieOptions);
    res.cookie("CloudFront-Key-Pair-Id", keyPairId, cookieOptions);

    // 3. Return the clean URL
    const videoUrl = `https://${domain}/streaming-output/${videoId}/${videoId}_${quality}.m3u8`;
    
    res.json({ videoUrl, videoId, quality, expiresInSeconds: 7200 });

  } catch (err) {
    console.error("Lambda Communication Error:", err);
    res.status(500).json({ error: "Failed to generate signed cookies via Lambda" });
  }
});

module.exports = router;