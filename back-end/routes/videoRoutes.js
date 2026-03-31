const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { requireAuth } = require("@clerk/express");
const { param, query, validationResult } = require("express-validator");
const forge = require("node-forge"); // Replaced AWS SDK with pure JS cryptography
const User = require("../models/User");
const VideoProgress = require("../models/VideoProgress");

// ── CloudFront config from env ──
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN; 
const CLOUDFRONT_KEY_ID = process.env.CLOUDFRONT_KEY_ID; 

let CLOUDFRONT_PRIVATE_KEY = "";

if (process.env.CLOUDFRONT_PRIVATE_KEY) {
  CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY
    .replace(/^["']|["']$/g, "") // 1. Strip hidden quotes Hostinger might wrap around the string
    .replace(/\\+n/g, "\n")      // 2. Convert the literal "\n" text into real, actual line breaks
    .replace(/\r/g, "")          // 3. Destroy Windows carriage returns that crash Linux OpenSSL
    .trim();                     // 4. Clean up any accidental spaces at the very beginning or end
    
} else {
  console.error("❌ CLOUDFRONT_PRIVATE_KEY is missing in ENV");
}

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

// ── Generate a Custom Policy and Sign via Pure JS (node-forge) ──
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

  // AWS Specific Base64 Encoding Rules (+ to -, = to _, / to ~)
  const makeUrlSafe = (str) => str.replace(/\+/g, '-').replace(/=/g, '_').replace(/\//g, '~');

  try {
    // 1. Encode the Policy
    const encodedPolicy = makeUrlSafe(Buffer.from(customPolicy).toString('base64'));

    // 2. Sign the Policy using Pure JS (Bypassing Hostinger's OpenSSL ban)
    const privateKey = forge.pki.privateKeyFromPem(CLOUDFRONT_PRIVATE_KEY);
    const md = forge.md.sha1.create();
    md.update(customPolicy, 'utf8');
    const signatureBytes = privateKey.sign(md);
    
    // 3. Encode the Signature
    const encodedSignature = makeUrlSafe(forge.util.encode64(signatureBytes));

    // 4. Construct the final URL
    return `https://${CLOUDFRONT_DOMAIN}/${s3Key}?Policy=${encodedPolicy}&Signature=${encodedSignature}&Key-Pair-Id=${CLOUDFRONT_KEY_ID}`;
    
  } catch (err) {
    console.error("Node-Forge Signing Error:", err);
    throw new Error("Failed to sign URL with Pure JS");
  }
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
      res.status(500).json({ 
        error: "Server error",
        debugMessage: "Failed to sign CloudFront URL", 
        exactError: err.message,
        keyLength: CLOUDFRONT_PRIVATE_KEY ? CLOUDFRONT_PRIVATE_KEY.length : 0,
        keyPreview: CLOUDFRONT_PRIVATE_KEY ? CLOUDFRONT_PRIVATE_KEY.substring(0, 40) : "MISSING",
        keyEndPreview: CLOUDFRONT_PRIVATE_KEY ? CLOUDFRONT_PRIVATE_KEY.slice(-40) : "MISSING"
      });
    }
  }
);

module.exports = router;