const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { clerkMiddleware, requireAuth } = require("@clerk/express");
const User = require("./models/User");

const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const paymentRoutes = require("./routes/paymentRoutes"); // ✅ NEW
const quizRoutes = require("./routes/quizRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ================= RATE LIMIT =================
app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
  })
);

// ================= BASIC MIDDLEWARE =================
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= CLERK AUTH =================
app.use(
  clerkMiddleware({
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.VITE_CLERK_SECRET_KEY,
  })
);

// ================= ATTACH DB USER TO req.user =================
app.use(async (req, res, next) => {
  try {
    const clerkId = req.auth()?.userId;

    if (!clerkId) return next();

    const dbUser = await User.findOne({ clerkId });

    if (!dbUser) {
      return res.status(401).json({ error: "User not synced" });
    }

    req.user = dbUser;
    next();
  } catch (err) {
    console.error("Auth attach error:", err);
    res.status(500).json({ error: "Auth error" });
  }
});

// ================= ADMIN ROUTES =================
app.use("/admin", requireAuth(), adminRoutes);

// ================= COURSE ROUTES =================
app.use("/courses", courseRoutes);

// ================= QUIZ ROUTES =================
app.use("/quiz", quizRoutes);

// ================= PAYMENT ROUTES =================
app.use("/payments", paymentRoutes); // ✅ NEW

// ================= MONGODB =================
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

// ================= FEEDBACK SCHEMA =================
const commentSchema = new mongoose.Schema(
  {
    name: { type: String, index: true },

    image: {
      type: String,
      default:
        "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp",
      set: (v) =>
        v === ""
          ? "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp"
          : v,
    },

    rating: { type: Number, index: true },
    comment: String,

    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", commentSchema);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ================= FEEDBACK ROUTES =================
app.post("/feedback/new", async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json({ message: "Feedback saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/feedback", async (req, res) => {
  const data = await Feedback.find({});
  res.json(data);
});

app.delete("/feedback/:id", async (req, res) => {
  await Feedback.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ================= USER AUTO SYNC =================
app.post("/api/user/sync", async (req, res) => {
  try {
    const { clerkId, fullName, email, profileImage } = req.body;

    let user = await User.findOne({ clerkId });

    if (!user) {
      const userCount = await User.countDocuments();

      user = await User.create({
        clerkId,
        fullName,
        email,
        profileImage,
        role: userCount === 0 ? "superadmin" : "student",
      });

      console.log("✅ New user created with role:", user.role);
    }

    res.json(user);
  } catch (error) {
    console.error("User sync error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
