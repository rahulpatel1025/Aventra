const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const { param, query, validationResult } = require("express-validator");
const forge = require("node-forge");
const User = require("../models/User");
const VideoProgress = require("../models/VideoProgress");

// ── CloudFront config ──
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const CLOUDFRONT_KEY_ID = process.env.CLOUDFRONT_KEY_ID;

// ── Parse private key — handles PKCS#8 and PKCS#1, with or without quotes ──
function parsePrivateKey() {
  const raw = process.env.CLOUDFRONT_PRIVATE_KEY;
  if (!raw) {
    console.error("❌ CLOUDFRONT_PRIVATE_KEY is missing");
    return null;
  }

  const cleaned = raw
    .replace(/^["']|["']$/g, "")   // strip surrounding quotes
    .replace(/\\n/g, "\n")          // literal \n → real newline
    .replace(/\r/g, "")             // strip carriage returns
    .trim();

  try {
    // Try PKCS#8 first (BEGIN PRIVATE KEY)
    if (cleaned.includes("BEGIN PRIVATE KEY")) {
      const keyInfo = forge.pki.privateKeyInfoFromPem(cleaned);
      return forge.pki.privateKeyFromAsn1(forge.asn1.fromDer(keyInfo.privateKey));
    }
    // Try PKCS#1 (BEGIN RSA PRIVATE KEY)
    if (cleaned.includes("BEGIN RSA PRIVATE KEY")) {
      return forge.pki.privateKeyFromPem(cleaned);
    }
    console.error("❌ Unknown private key format");
    return null;
  } catch (err) {
    console.error("❌ Failed to parse private key:", err.message);
    return null;
  }
}

const PRIVATE_KEY = parsePrivateKey();

// ── FinTech video catalogue ──
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

// ── AWS URL-safe Base64 ──
function awsBase64(str) {
  return str.replace(/\+/g, "-").replace(/=/g, "_").replace(/\//g, "~");
}

// ── Generate CloudFront signed URL using node-forge ──
// Works with both PKCS#8 and PKCS#1 keys, bypasses Node.js 18 OpenSSL restrictions
function generateSignedUrl(videoId, s3Key) {
  if (!PRIVATE_KEY) throw new Error("Private key not loaded");

  const expiresAt = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours

  // Custom policy — grants access to entire video folder for 2 hours
  const policy = JSON.stringify({
    Statement: [
      {
        Resource: `https://${CLOUDFRONT_DOMAIN}/streaming-output/${videoId}/*`,
        Condition: {
          DateLessThan: { "AWS:EpochTime": expiresAt },
        },
      },
    ],
  });

  // Sign with SHA-1 (CloudFront requirement)
  const md = forge.md.sha1.create();
  md.update(policy, "utf8");
  const signature = PRIVATE_KEY.sign(md);

  const encodedPolicy = awsBase64(Buffer.from(policy).toString("base64"));
  const encodedSignature = awsBase64(forge.util.encode64(signature));

  return `https://${CLOUDFRONT_DOMAIN}/${s3Key}?Policy=${encodedPolicy}&Signature=${encodedSignature}&Key-Pair-Id=${CLOUDFRONT_KEY_ID}`;
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
      if (!enrolled) return res.status(403).json({ error: "Not enrolled" });

      const catalogue = getVideoCatalogue(courseId);
      if (!catalogue) return res.status(404).json({ error: "Course not found" });

      const progressRecords = await VideoProgress.find({ userId, courseId });
      const progressMap = {};
      progressRecords.forEach((p) => { progressMap[p.videoId] = p; });

      const videos = catalogue.map((video, i) => {
        const progress = progressMap[video.videoId];
        const completed = progress?.completed || false;
        const watchPercent = progress?.watchPercent || 0;
        const previousCompleted = i === 0 ? true : progressMap[catalogue[i - 1].videoId]?.completed || false;

        return {
          videoId: video.videoId,
          index: video.index,
          title: video.title,
          isLocked: !previousCompleted,
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
      if (!enrolled) return res.status(403).json({ error: "Not enrolled" });

      const catalogue = getVideoCatalogue(courseId);
      if (!catalogue) return res.status(404).json({ error: "Course not found" });

      const videoMeta = catalogue.find((v) => v.videoId === videoId);
      if (!videoMeta) return res.status(404).json({ error: "Video not found" });

      // Sequential gating — must complete previous video first
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
      log.info(`Signed URL: userId=${userId} videoId=${videoId} quality=${quality}`);

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
      log.error("Signed URL error:", err.message);
      res.status(500).json({ error: "Failed to generate video URL" });
    }
  }
);

module.exports = router;