const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");

// ================= REFERRAL CODES =================
// All codes stored server-side only — never exposed to the frontend bundle
const REFERRAL_CODES = {
  "AVENTRA1000": {
    type: "fixed",
    discount: 1000,
    label: "₹1,000 off",
    active: true,
    sendBenefitsEmail: false,
  },
  "AVENTRADEV1": {
    type: "leave_one",   // pay only ₹1 — internal testing
    discount: null,
    label: "Pay just ₹1",
    active: true,
    sendBenefitsEmail: false,
  },
  "MINI10": {
    type: "none",        // no discount — benefits email only
    discount: 0,
    label: "MINI10 — Internship Support Activated",
    active: true,
    sendBenefitsEmail: true,
    benefits: [
      "100% Internship Support — guaranteed placement after course completion",
      "Dedicated placement coordinator assigned to your profile",
      "Resume review and LinkedIn profile optimisation",
      "Mock interviews with industry professionals",
      "Priority access to Aventra's hiring partner network",
      "Money-back guarantee if internship not secured",
    ],
  },
};

// ================= VALIDATE REFERRAL CODE =================
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ valid: false, message: errors.array()[0].msg });
    }

    const code = req.body.code.trim().toUpperCase();
    const coursePrice = Number(req.body.coursePrice);
    const entry = REFERRAL_CODES[code];

    if (!entry || !entry.active) {
      return res.status(200).json({ valid: false, message: "Invalid referral code" });
    }

    let discount = 0;
    if (entry.type === "fixed") {
      discount = Math.min(entry.discount, coursePrice - 1);
    } else if (entry.type === "leave_one") {
      discount = coursePrice - 1;
    } else if (entry.type === "none") {
      discount = 0; // MINI10 — no discount
    }

    const finalPrice = Math.max(1, coursePrice - discount);

    return res.status(200).json({
      valid: true,
      discount,
      finalPrice,
      label: entry.label,
      sendBenefitsEmail: entry.sendBenefitsEmail || false,
      benefits: entry.benefits || [],
    });
  }
);

module.exports = router;