const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const path = require("path");
const winston = require("winston");
require("dotenv").config();

const { clerkMiddleware, requireAuth } = require("@clerk/express");
const User = require("./models/User");

const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const quizRoutes = require("./routes/quizRoutes");
const referralRoutes = require("./routes/referralRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ================= LOGGER (winston) =================
// Structured logging — replaces console.log/error throughout
const logger = winston.createLogger({
  level: IS_PRODUCTION ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    IS_PRODUCTION
      ? winston.format.json()                        // machine-readable in prod
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack }) =>
            stack
              ? `${timestamp} [${level}]: ${message}\n${stack}`
              : `${timestamp} [${level}]: ${message}`
          )
        )
  ),
  transports: [
    new winston.transports.Console(),
    // In production also write to a file for debugging on Hostinger
    ...(IS_PRODUCTION
      ? [
          new winston.transports.File({ filename: "logs/error.log", level: "error" }),
          new winston.transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
});

// Make logger globally available so routes can use it too
global.logger = logger;

// ================= TRUST PROXY =================
if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

// ================= HELMET (Security Headers) =================
// Sets X-Frame-Options, Content-Security-Policy, X-XSS-Protection, etc.
app.use(
  helmet({
    contentSecurityPolicy: IS_PRODUCTION
      ? undefined  // use helmet's strict default in production
      : false,     // disable CSP in dev to avoid breaking Vite HMR
    crossOriginEmbedderPolicy: false, // needed for Razorpay iframe to work
  })
);

// ================= RATE LIMIT =================
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.use("/api", limiter);

// ================= CORS =================
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://aventratechsolution.com",
  "https://www.aventratechsolution.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      logger.warn(`CORS blocked for origin: ${origin}`);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// ================= BASIC MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= REQUEST LOGGER =================
// Logs every incoming API request — useful for debugging on Hostinger
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
      logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} — ${ms}ms`);
    });
  }
  next();
});

// ================= CLERK AUTH =================
const clerkPublishableKey =
  process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey =
  process.env.CLERK_SECRET_KEY || process.env.VITE_CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  logger.warn("CLERK_SECRET_KEY is not set. Auth will not work correctly.");
}

app.use(
  clerkMiddleware({
    publishableKey: clerkPublishableKey,
    secretKey: clerkSecretKey,
  })
);

// ================= ATTACH DB USER =================
app.use(async (req, res, next) => {
  try {
    const authData = typeof req.auth === "function" ? req.auth() : req.auth;
    const authUserId = authData?.userId;

    if (!authUserId) return next();

    const dbUser = await User.findOne({ clerkId: authUserId });
    if (dbUser) req.user = dbUser;

    next();
  } catch (err) {
    logger.error("User attach error:", err);
    next();
  }
});

// ================= USER SYNC =================
app.post("/api/user/sync", async (req, res) => {
  try {
    const { clerkId, fullName, email, profileImage } = req.body;

    const authData = typeof req.auth === "function" ? req.auth() : req.auth;
    const authUserId = authData?.userId;
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
        role: userCount === 0 ? "superadmin" : "student",
      });
      logger.info(`New user synced: ${user.email} (${user.role})`);
    } else {
      const updates = {};
      if (!user.fullName && fullName) updates.fullName = fullName;
      if (
        (!user.email || user.email.includes("privaterelay.appleid.com")) &&
        email &&
        !email.includes("privaterelay.appleid.com")
      ) {
        updates.email = email;
      }
      if (Object.keys(updates).length > 0) {
        await User.findOneAndUpdate({ clerkId: validId }, { $set: updates });
        Object.assign(user, updates);
        logger.info(`User profile updated: ${JSON.stringify(updates)}`);
      }
    }

    res.json({ message: "User synced successfully", user });
  } catch (error) {
    logger.error("User sync error:", error);
    res.status(500).json({ error: "Server error during sync" });
  }
});

// ================= GET CURRENT USER =================
// Single definition — duplicate removed
app.get("/api/user/me", async (req, res) => {
  try {
    const authData = typeof req.auth === "function" ? req.auth() : req.auth;
    const authUserId = authData?.userId;

    if (!authUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId: authUserId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    logger.error("Get user error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= API ROUTES =================
app.use("/api/admin", requireAuth(), adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/referral", referralRoutes);

// ================= FEEDBACK =================
const commentSchema = new mongoose.Schema(
  {
    name: { type: String, index: true },
    image: {
      type: String,
      default:
        "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp",
    },
    rating: { type: Number, index: true },
    comment: String,
    date: { type: Date, default: Date.now },
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
    logger.error("Feedback save error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/feedback", async (req, res) => {
  try {
    const data = await Feedback.find({});
    res.json(data);
  } catch (err) {
    logger.error("Feedback fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/feedback/:id", async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    logger.error("Feedback delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================= MONGODB WITH RETRY LOGIC =================
const MONGO_MAX_RETRIES = 5;
const MONGO_RETRY_DELAY_MS = 5000; // 5 seconds between retries

async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 10000, // give up finding a server after 10s
      socketTimeoutMS: 45000,          // close sockets after 45s inactivity
    });
    logger.info("MongoDB Connected");
  } catch (err) {
    if (attempt >= MONGO_MAX_RETRIES) {
      logger.error(`MongoDB failed after ${MONGO_MAX_RETRIES} attempts. Exiting.`, err);
      process.exit(1);
    }
    logger.warn(
      `MongoDB connection attempt ${attempt} failed. Retrying in ${MONGO_RETRY_DELAY_MS / 1000}s...`
    );
    await new Promise((resolve) => setTimeout(resolve, MONGO_RETRY_DELAY_MS));
    return connectWithRetry(attempt + 1);
  }
}

// Handle disconnects that happen AFTER initial connection
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected. Attempting reconnect...");
  setTimeout(() => connectWithRetry(), MONGO_RETRY_DELAY_MS);
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error:", err);
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
});

// ================= SERVE FRONTEND (Production only) =================
if (IS_PRODUCTION) {
  app.use(express.static(path.join(__dirname, "../dist")));

  app.get("*", (req, res) => {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
} else {
  app.use((req, res) => {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.status(200).send(
      "Backend running in development mode. Use Vite (port 5173) for the frontend."
    );
  });
}

// ================= SERVER =================
connectWithRetry().then(() => {
  app.listen(PORT, () => {
    logger.info(
      `Server running on port ${PORT} [${IS_PRODUCTION ? "production" : "development"}]`
    );
  });
});