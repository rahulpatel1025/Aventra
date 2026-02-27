const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Clerk middleware
const { requireAuth } = require("@clerk/express");

// Your role middleware
const requireAdmin = require("../middleware/requireAdmin");

// ✅ Only logged-in superadmin can access
router.get(
  "/users",
  requireAuth(),   // 1️⃣ must be logged in (Clerk)
  requireAdmin,    // 2️⃣ must be superadmin in MongoDB
  async (req, res) => {
    const users = await User.find();
    res.json(users);
  }
);

module.exports = router;
