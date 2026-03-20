const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");

// ================= REFERRAL CODES =================
// Stored server-side only — never sent to the frontend bundle
// To add a new code: add an entry below and redeploy
const REFERRAL_CODES = {
  "AVENTRA1000": {
    type: "fixed",          // fixed amount off
    discount: 1000,
    label: "₹1,000 off",
    active: true,
  },
  "AVENTRADEV1": {
    type: "leave_one",      // pay only ₹1 — for internal testing
    discount: null,         // calculated dynamically from course price
    label: "Pay just ₹1",
    active: true,
  },
};

// ================= VALIDATE REFERRAL CODE =================
// POST /api/referral/validate
// Body: { code: string, coursePrice: number }
// Returns: { valid, discount, finalPrice, label }
router.post(
  "/validate",
  [
    body("code")
      .trim()
      .notEmpty().withMessage("Referral code is required")
      .isLength({ max: 30 }).withMessage("Invalid code format"),

    body("coursePrice")
      .isNumeric().withMessage("Course price must be a number")
      .custom((val) => val > 0).withMessage("Course price must be greater than 0"),
  ],
  async (req, res) => {
    // ── Input validation errors ──
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        valid: false,
        message: errors.array()[0].msg,
      });
    }

    const code = req.body.code.trim().toUpperCase();
    const coursePrice = Number(req.body.coursePrice);

    const entry = REFERRAL_CODES[code];

    // Code not found or inactive
    if (!entry || !entry.active) {
      return res.status(200).json({
        valid: false,
        message: "Invalid referral code",
      });
    }

    // Calculate discount
    let discount = 0;
    if (entry.type === "fixed") {
      discount = Math.min(entry.discount, coursePrice - 1); // never reduce below ₹1
    } else if (entry.type === "leave_one") {
      discount = coursePrice - 1; // leave exactly ₹1
    }

    const finalPrice = Math.max(1, coursePrice - discount);

    return res.status(200).json({
      valid: true,
      discount,
      finalPrice,
      label: entry.label,
    });
  }
);

module.exports = router;