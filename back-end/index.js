const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { clerkMiddleware, requireAuth } = require("@clerk/express");

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

// ================= ATTACH DB USER =================
// This safely attaches the Mongo user to the request if they exist.
// It DOES NOT block the request if they are brand new.
app.use(async (req, res, next) => {
  try {
    const auth = req.auth();
    if (!auth?.userId) return next();

    const dbUser = await User.findOne({ clerkId: auth.userId });
    if (dbUser) {
      req.user = dbUser;
    }
    next();
  } catch (err) {
    console.error("User attach error:", err);
    next();
  }
});

// ================= EXPLICIT USER SYNC ROUTE =================
// The frontend hits this right after login to save the user to MongoDB
app.post("/api/user/sync", requireAuth(), async (req, res) => {
  try {
    const { clerkId, fullName, email, profileImage } = req.body;
    
    // Security check: Ensure token matches the requested clerkId
    if (req.auth().userId !== clerkId) {
      return res.status(403).json({ error: "Unauthorized sync attempt" });
    }

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
      console.log("✅ New user synced to MongoDB:", user.email);
    }

    res.json({ message: "User synced successfully", user });
  } catch (error) {
    console.error("User sync error:", error);
    res.status(500).json({ error: "Server error during sync" });
  }
});

// ================= ROUTES =================
app.use("/admin", requireAuth(), adminRoutes);
app.use("/courses", courseRoutes);
app.use("/quiz", quizRoutes);
app.use("/payments", paymentRoutes);

// ================= MONGODB =================
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

// ================= FEEDBACK SCHEMA & ROUTES =================
const commentSchema = new mongoose.Schema(
  {
    name: { type: String, index: true },
    image: {
      type: String,
      default: "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp",
      set: (v) => v === "" ? "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp" : v,
    },
    rating: { type: Number, index: true },
    comment: String,
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", commentSchema);

app.get("/", (req, res) => res.send("Backend running 🚀"));

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