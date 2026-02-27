const User = require("../models/User");

module.exports = async function requireAdmin(req, res, next) {
  try {
    console.log("🔥 Incoming request to requireAdmin");

    // ✅ Call req.auth() (NOT req.auth.userId)
    const { userId } = req.auth();

    console.log("🔥 userId from token:", userId);

    if (!userId) {
      console.log("❌ No userId found in token");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId: userId });
    console.log("🔥 User from DB:", user);

    if (!user) {
      console.log("❌ No user found in DB");
      return res.status(403).json({ message: "Admin access only" });
    }

    console.log("🔥 User role:", user.role);

    if (user.role !== "superadmin") {
      console.log("❌ User is not superadmin");
      return res.status(403).json({ message: "Admin access only" });
    }

    console.log("✅ Superadmin verified");
    req.user = user;

    next();
  } catch (err) {
    console.error("🔥 requireAdmin error:", err);
    res.status(500).json({ message: "Auth error" });
  }
};
