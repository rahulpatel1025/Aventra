const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const { param, query, validationResult } = require("express-validator");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const User = require("../models/User");
const VideoProgress = require("../models/VideoProgress");

// ── CloudFront config from env ──
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN; 
const CLOUDFRONT_KEY_ID = process.env.CLOUDFRONT_KEY_ID; 

// Grab the key, strip any accidental quotes/spaces Hostinger might have added
const rawBase64 = (process.env.CLOUDFRONT_PRIVATE_KEY_BASE64 || "")
  .replace(/['"]/g, "")
  .trim();

// Decode it and force all Windows line-breaks (\r\n) into Linux line-breaks (\n)
const CLOUDFRONT_PRIVATE_KEY = Buffer.from(rawBase64, "base64")
  .toString("utf8")
  .replace(/\r\n/g, "\n");

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
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return null;
}

async function verifyEnrollment(userId, courseId) {
  const user = await User.findOne({ clerkId: userId });
  if (!user) return false;
  if (user.role === "superadmin") return true;
  return user.purchasedCourses.some((id) => id.toString() === courseId);
}

// ── THE FIX: Generate a Custom Policy for the entire folder ──
function generateSignedUrl(videoId, s3Key) {
  const expiresAt = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours

  // This policy allows access to anything inside the specific video folder (/*)
  const customPolicy = JSON.stringify({
    Statement: [
      {
        Resource: `https://${CLOUDFRONT_DOMAIN}/streaming-output/${videoId}/*`,
        Condition: {
          DateLessThan: { "AWS:EpochTime": expiresAt },
        },
      },
    ],
  });

  const url = `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;

  return getSignedUrl({
    url,
    keyPairId: CLOUDFRONT_KEY_ID,
    privateKey: CLOUDFRONT_PRIVATE_KEY,
    policy: customPolicy,
  });
}

// ── GET /api/videos/catalogue/:courseId ──
router.get(
  "/catalogue/:courseId",
  requireAuth(),
  [param("courseId").isMongoId().withMessage("Invalid courseId")],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { userId } = req.auth();
      const { courseId } = req.params;

      const enrolled = await verifyEnrollment(userId, courseId);
      if (!enrolled) return res.status(403).json({ error: "Not enrolled in this course" });

      const catalogue = getVideoCatalogue(courseId);
      if (!catalogue) return res.status(404).json({ error: "Course video catalogue not found" });

      const progressRecords = await VideoProgress.find({ userId, courseId });
      const progressMap = {};
      progressRecords.forEach((p) => { progressMap[p.videoId] = p; });

      const videos = catalogue.map((video, i) => {
        const progress = progressMap[video.videoId];
        const completed = progress?.completed || false;
        const watchPercent = progress?.watchPercent || 0;

        const previousCompleted = i === 0 ? true : progressMap[catalogue[i - 1].videoId]?.completed || false;
        const isLocked = !previousCompleted;

        return {
          videoId: video.videoId,
          index: video.index,
          title: video.title,
          isLocked,
          completed,
          watchPercent,
        };
      });

      res.json({ videos });
    } catch (err) {
      const log = global.logger || console;
      log.error("Catalogue fetch error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ── GET /api/videos/signed-url ──
router.get(
  "/signed-url",
  requireAuth(),
  [
    query("courseId").isMongoId().withMessage("Invalid courseId"),
    query("videoId").trim().notEmpty().withMessage("videoId is required"),
    query("quality").optional().isIn(["1080p", "720p", "360p"]).withMessage("Invalid quality"),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { userId } = req.auth();
      const { courseId, videoId, quality = "720p" } = req.query;

      const enrolled = await verifyEnrollment(userId, courseId);
      if (!enrolled) return res.status(403).json({ error: "Not enrolled in this course" });

      const catalogue = getVideoCatalogue(courseId);
      if (!catalogue) return res.status(404).json({ error: "Course not found" });

      const videoMeta = catalogue.find((v) => v.videoId === videoId);
      if (!videoMeta) return res.status(404).json({ error: "Video not found" });

      if (videoMeta.index > 0) {
        const prevVideo = catalogue[videoMeta.index - 1];
        const prevProgress = await VideoProgress.findOne({
          userId,
          courseId,
          videoId: prevVideo.videoId,
          completed: true,
        });
        if (!prevProgress) {
          return res.status(403).json({
            error: "Complete the previous video first",
            blockedBy: prevVideo.videoId,
            blockedByTitle: prevVideo.title,
          });
        }
      }

      const s3Key = `streaming-output/${videoId}/${videoId}_${quality}.m3u8`;
      
      // ── THE FIX: Pass videoId into the generator so it can wildcard the folder ──
      const signedUrl = generateSignedUrl(videoId, s3Key);

      const log = global.logger || console;
      log.info(`Signed URL issued: userId=${userId} videoId=${videoId} quality=${quality}`);

      res.json({
        signedUrl,
        videoId,
        quality,
        title: videoMeta.title,
        index: videoMeta.index,
        expiresInSeconds: 7200,
      });
    } catch (err) {
      const log = global.logger || console;
      log.error("Signed URL error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;