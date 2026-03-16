const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const { clerkMiddleware, requireAuth } = require("@clerk/express");

const User = require("./models/User");

const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const quizRoutes = require("./routes/quizRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ================= TRUST PROXY (IMPORTANT FOR HOSTINGER) =================
app.set("trust proxy", 1);

// ================= RATE LIMIT =================
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later."
});

app.use(limiter);

// ================= CORS =================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://aventratechsolution.com",
      "https://www.aventratechsolution.com"
    ],
    credentials: true
  })
);

// ================= BASIC MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= CLERK AUTH =================
app.use(
  clerkMiddleware({
    publishableKey:
      process.env.CLERK_PUBLISHABLE_KEY ||
      process.env.VITE_CLERK_PUBLISHABLE_KEY,
    secretKey:
      process.env.CLERK_SECRET_KEY ||
      process.env.VITE_CLERK_SECRET_KEY
  })
);

// ================= ATTACH DB USER =================
app.use(async (req, res, next) => {
  try {
    let authUserId = null;

    if (req.auth) {
      const authData = typeof req.auth === "function" ? req.auth() : req.auth;
      authUserId = authData?.userId;
    }

    if (!authUserId) return next();

    const dbUser = await User.findOne({ clerkId: authUserId });

    if (dbUser) {
      req.user = dbUser;
    }

    next();
  } catch (err) {
    console.error("User attach error:", err);
    next();
  }
});

// ================= USER SYNC =================
app.post("/api/user/sync", async (req, res) => {
  try {
    const { clerkId, fullName, email, profileImage } = req.body;

    let authUserId = null;

    if (req.auth) {
      const authData = typeof req.auth === "function" ? req.auth() : req.auth;
      authUserId = authData?.userId;
    }

    const validId = authUserId || clerkId;

    if (!validId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let user = await User.findOne({ clerkId: validId });

    if (!user) {
      const userCount = await User.countDocuments();

      user = await User.create({
        clerkId: validId,
        fullName,
        email,
        profileImage,
        role: userCount === 0 ? "superadmin" : "student"
      });

      console.log("New user synced:", user.email);
    }

    res.json({ message: "User synced successfully", user });

  } catch (error) {
    console.error("User sync error:", error);
    res.status(500).json({ error: "Server error during sync" });
  }
});

// ================= API ROUTES =================
app.use("/api/admin", requireAuth(), adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/payments", paymentRoutes);

// ================= FEEDBACK =================
const commentSchema = new mongoose.Schema(
  {
    name: { type: String, index: true },
    image: {
      type: String,
      default:
        "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp"
    },
    rating: { type: Number, index: true },
    comment: String,
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", commentSchema);

app.post("/api/feedback/new", async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json({ message: "Feedback saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/feedback", async (req, res) => {
  const data = await Feedback.find({});
  res.json(data);
});

app.delete("/api/feedback/:id", async (req, res) => {
  await Feedback.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ================= MONGODB =================
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

// ================= SERVE FRONTEND =================
app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }

  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// ================= SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});