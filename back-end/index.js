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
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ================= TRUST PROXY =================
// Required for Hostinger / reverse proxies
if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

// ================= RATE LIMIT =================
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

app.use("/api", limiter); // Only rate-limit API routes, not static files

// ================= CORS =================
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://aventratechsolution.com",
  "https://www.aventratechsolution.com"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

// ================= BASIC MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= CLERK AUTH =================
// Consolidate key resolution — VITE_ prefix is frontend-only, but we support both for flexibility
const clerkPublishableKey =
  process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey =
  process.env.CLERK_SECRET_KEY || process.env.VITE_CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  console.warn("⚠️  CLERK_SECRET_KEY is not set. Auth will not work correctly.");
}

app.use(
  clerkMiddleware({
    publishableKey: clerkPublishableKey,
    secretKey: clerkSecretKey
  })
);

// ================= ATTACH DB USER =================
// Resolves Clerk auth and attaches the matching MongoDB user to req.user
app.use(async (req, res, next) => {
  try {
    const authData = typeof req.auth === "function" ? req.auth() : req.auth;
    const authUserId = authData?.userId;

    if (!authUserId) return next();

    const dbUser = await User.findOne({ clerkId: authUserId });
    if (dbUser) req.user = dbUser;

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

    const authData = typeof req.auth === "function" ? req.auth() : req.auth;
    const authUserId = authData?.userId;

    // Accept either the verified auth ID or the body-supplied clerkId (fallback)
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

      console.log(`✅ New user synced: ${user.email} (${user.role})`);
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
const mongoose_Schema = mongoose.Schema;

const commentSchema = new mongoose_Schema(
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
  try {
    const data = await Feedback.find({});
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/feedback/:id", async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= MONGODB =================
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

// ================= SERVE FRONTEND (Production only) =================
// In development, Vite runs separately on port 5173, so we skip this
if (IS_PRODUCTION) {
  app.use(express.static(path.join(__dirname, "../dist")));

  app.get("*", (req, res) => {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
} else {
  // Dev fallback — helpful if someone hits a non-existent API route
  app.use((req, res) => {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.status(200).send("Backend running in development mode. Use Vite (port 5173) for the frontend.");
  });
}

// ================= SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${IS_PRODUCTION ? "production" : "development"}]`);
});