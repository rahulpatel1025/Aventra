const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const { param, validationResult } = require("express-validator");
const User = require("../models/User");
const requireAdmin = require("../middleware/requireAdmin");

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return null;
}

// ── GET /api/admin/users — superadmin only ──
router.get(
  "/users",
  requireAuth(),
  requireAdmin,
  async (req, res) => {
    try {
      const users = await User.find().select("-__v");
      res.json(users);
    } catch (err) {
      const log = global.logger || console;
      log.error("Admin fetch users error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ── GET /api/admin/users/:id — fetch single user ──
router.get(
  "/users/:id",
  requireAuth(),
  requireAdmin,
  [
    param("id").isMongoId().withMessage("Invalid user ID format"),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const user = await User.findById(req.params.id).select("-__v");
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      const log = global.logger || console;
      log.error("Admin fetch user error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;