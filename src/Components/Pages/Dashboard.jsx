import React, { useState, useEffect } from "react";
import "../../assets/css/dashboard.css";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { UserButton, useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [justEnrolled, setJustEnrolled] = useState(false);
  useEffect(() => {
  if (justEnrolled) {
    const timer = setTimeout(() => setJustEnrolled(false), 5000);
    return () => clearTimeout(timer);
  }
}, [justEnrolled]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    // Check if we were redirected here after a successful payment
    if (location.state?.enrolled) {
      setJustEnrolled(true);
    }

    const syncAndGetUser = async () => {
      try {
        const token = await getToken();

        // Step 1: Sync user (creates if new, no-op if exists)
        await axios.post(
          "/api/user/sync",
          {
            clerkId: user.id,
            fullName: user.fullName,
            email: user.primaryEmailAddress?.emailAddress,
            profileImage: user.imageUrl,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Step 2: Always fetch FRESH user data from DB
        // This ensures hasPurchased + purchasedCourses are up to date
        // especially right after a payment redirect
        const freshRes = await axios.get("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedUser = freshRes.data;
        setDbUser(fetchedUser);
        console.log("✅ Fetched User from DB:", fetchedUser);

      } catch (err) {
        console.error("Failed to fetch user data:", err);
      } finally {
        setLoading(false);
      }
    };

    syncAndGetUser();
  }, [user, isLoaded, isSignedIn, getToken, location.state]);

  if (!isLoaded || loading) return (
    <div style={{ padding: 40, textAlign: "center", fontSize: "18px" }}>
      Loading Dashboard...
    </div>
  );

  if (!isSignedIn) return (
    <div style={{ padding: 40, textAlign: "center", color: "red" }}>
      Please log in to access the dashboard.
    </div>
  );

  if (!dbUser) return (
    <div style={{ padding: 40, textAlign: "center", color: "red" }}>
      Error loading user profile. Please refresh the page.
    </div>
  );

  // 🔴 SECURITY CHECK: RESTRICT ACCESS IF NOT PURCHASED AND NOT SUPERADMIN
  if (!dbUser.hasPurchased && dbUser.role !== "superadmin") {
    return (
      <div
        className="dashboard-layout"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#020617",
        }}
      >
        <div
          className="glass-card animated center"
          style={{
            maxWidth: "450px",
            textAlign: "center",
            padding: "50px 30px",
            border: "1px solid #1e293b",
            borderRadius: "16px",
            background: "#0f172a",
          }}
        >
          <div style={{ fontSize: "50px", marginBottom: "15px" }}>🔒</div>
          <h2 style={{ color: "#ef4444", marginBottom: "15px" }}>Access Restricted</h2>
          <p
            style={{
              marginBottom: "30px",
              fontSize: "16px",
              color: "#94a3b8",
              lineHeight: "1.6",
            }}
          >
            Your dashboard is currently locked. You need to enroll in at least
            one course to unlock your student dashboard, access the FinTech
            Quiz, and track your progress.
          </p>
          <button
            onClick={() => navigate("/courses")}
            style={{
              padding: "12px 30px",
              background: "#38bdf8",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
              marginBottom: "20px",
            }}
          >
            Explore Courses
          </button>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              color: "#64748b",
              marginTop: "10px",
            }}
          >
            <span>Sign out or switch account:</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    );
  }

  // ✅ Check if user purchased at least one course or is a superadmin
  const hasPurchasedCourse =
    dbUser.role === "superadmin" ||
    (dbUser.purchasedCourses && dbUser.purchasedCourses.length > 0);

  // ✅ Calculate real quiz progress based on the 24 questions
  const totalQuizQuestions = 24;
  const progress = dbUser.quizScore
    ? Math.round((dbUser.quizScore / totalQuizQuestions) * 100)
    : 0;

  return (
    <div className="dashboard-layout">

      {/* ✅ Enrollment success banner — shown only right after payment redirect */}
      {justEnrolled && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#10b981",
            color: "#fff",
            padding: "14px 28px",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "15px",
            zIndex: 9999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            animation: "fadeIn 0.3s ease",
            cursor: "pointer",
          }}
          onClick={() => setJustEnrolled(false)}
        >
          🎉 Enrollment successful! Check your email for your invoice.
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="profile-card">
          <UserButton afterSignOutUrl="/" />
          <h4>{dbUser.fullName}</h4>
          <p>{dbUser.email}</p>
          <span
            style={{
              fontSize: "12px",
              color: "#38bdf8",
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            {dbUser.role === "superadmin" ? "Superadmin" : "Student"}
          </span>
        </div>

        <nav className="sidebar-menu">
          <a onClick={() => navigate("/")}>🏠 Home</a>
          <a className="active">🏠 Dashboard</a>
          <a onClick={() => navigate("/my-courses")}>📚 My Courses</a>
          <a>📊 Progress</a>

          {/* ✅ Show quiz only if purchased or superadmin */}
          {hasPurchasedCourse && (
            <a onClick={() => navigate("/quiz/fintech")}>🧠 FinTech Quiz</a>
          )}

          <a>🎓 Certificates</a>
          <a>⚙ Settings</a>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="dashboard-main">
        {/* HEADER */}
        <div className="dashboard-header">
          <h1>Student Dashboard</h1>

          <button
            className="theme-toggle"
            onClick={(e) => {
              document.body.classList.toggle("dark-mode");
              e.currentTarget.classList.toggle("active");
            }}
          >
            <span className="toggle-icon"></span>
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card animated">
            <h4>Courses</h4>
            <span>{dbUser.coursesEnrolled || 0}</span>
          </div>

          <div className="stat-card animated">
            <h4>Completed</h4>
            <span>{dbUser.completedCourses || 0}</span>
          </div>

          <div className="stat-card animated">
            <h4>Quiz Score</h4>
            <span style={{ color: dbUser.quizPassed ? "#10b981" : "inherit" }}>
              {dbUser.quizScore || 0} / {totalQuizQuestions}
            </span>
          </div>

          <div className="stat-card animated">
            <h4>Quiz Status</h4>
            <span
              style={{
                fontSize: "18px",
                color: dbUser.quizPassed ? "#10b981" : "#ef4444",
              }}
            >
              {dbUser.quizPassed ? "PASSED ✅" : "PENDING"}
            </span>
          </div>
        </div>

        {/* GRID */}
        <div className="dashboard-grid">
          {/* PROGRESS */}
          <div className="glass-card animated center">
            <h3>FinTech Quiz Progress</h3>

            <div
              className="circle-wrap"
              style={{ width: "150px", margin: "20px auto" }}
            >
              <CircularProgressbar
                value={progress}
                text={`${progress}%`}
                styles={buildStyles({
                  pathColor: dbUser.quizPassed ? "#10b981" : "#38bdf8",
                  textColor: dbUser.quizPassed ? "#10b981" : "#38bdf8",
                  trailColor: "rgba(0,0,0,0.1)",
                })}
              />
            </div>

            <p style={{ marginTop: "10px", color: "#64748b" }}>
              Attempts Used: {dbUser.quizAttempts || 0} / 3
            </p>
          </div>

          {/* ANNOUNCEMENTS */}
          <div className="glass-card animated">
            <h3>📢 Announcements</h3>
            <ul style={{ lineHeight: "2" }}>
              <li>🚀 Internship onboarding starts next week.</li>
              <li>📘 New React course launching soon.</li>
              <li>🎯 Resume workshop on Friday.</li>
              {dbUser.quizPassed && (
                <li style={{ color: "#10b981", fontWeight: "bold" }}>
                  🏆 Your FinTech Certificate is ready to download!
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}