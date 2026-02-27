const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { clerkMiddleware, requireAuth } = require("@clerk/express");
const { clerkClient } = require("@clerk/clerk-sdk-node");

const User = require("./models/User");

const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
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

// ================= AUTO SYNC USER =================
app.use(async (req, res, next) => {
  try {
    const auth = req.auth();

    if (!auth?.userId) {
      return next();
    }

    const clerkId = auth.userId;

    let dbUser = await User.findOne({ clerkId });

    if (!dbUser) {
      const clerkUser = await clerkClient.users.getUser(clerkId);

      const userCount = await User.countDocuments();

      dbUser = await User.create({
        clerkId,
        fullName: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        email: clerkUser.emailAddresses[0]?.emailAddress,
        profileImage: clerkUser.imageUrl,
        role: userCount === 0 ? "superadmin" : "student",
      });

      console.log("✅ Auto-synced new user:", dbUser.email);
    }

    req.user = dbUser;
    next();

  } catch (err) {
    console.error("Auto-sync error:", err);
    res.status(500).json({ error: "Authentication error" });
  }
});

// ================= ROUTES =================
app.use("/admin", requireAuth(), adminRoutes);
app.use("/courses", courseRoutes);
app.use("/quiz", quizRoutes);
app.use("/payments", paymentRoutes);

// ✅ IMPORTANT: AUTH CHECK ROUTE (Triggers Auto Sync)
app.get("/api/me", requireAuth(), (req, res) => {
  res.json(req.user);
});

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

// ================= SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});