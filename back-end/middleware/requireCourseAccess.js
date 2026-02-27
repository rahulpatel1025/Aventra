const Course = require("../models/Course");

module.exports = async function requireCourseAccess(req, res, next) {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({
      slug,
      isPublished: true,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 🔐 Must be logged in
    if (!req.user) {
      return res.status(401).json({ message: "Login required" });
    }

    // 🧠 SUPERADMIN BYPASS
    if (req.user.role === "superadmin") {
      req.course = course;
      return next();
    }

    // 🎓 Student purchase check
    const hasAccess = req.user.purchasedCourses.some(
      (id) => id.toString() === course._id.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ message: "Purchase required" });
    }

    // ✅ Access granted
    req.course = course;
    next();

  } catch (err) {
    console.error("Course access error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
