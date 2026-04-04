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
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [isDark, setIsDark] = useState(document.body.classList.contains("dark-mode"));

  // Auto-dismiss enrollment banner
  useEffect(() => {
    if (justEnrolled) {
      const t = setTimeout(() => setJustEnrolled(false), 5000);
      return () => clearTimeout(t);
    }
  }, [justEnrolled]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setLoading(false); return; }
    if (location.state?.enrolled) setJustEnrolled(true);

    const init = async () => {
      try {
        const token = await getToken();
        // ── SAFARI WAKE-UP CALL ──
        // This "no-cors" fetch tells Safari that you are intentionally 
        // communicating with the CDN. It helps ensure your signed cookies 
        // are accepted for the video player later.
        fetch('https://cdn.aventratechsolution.com/streaming-output/FT01/FT01_720p.m3u8', { 
          mode: 'no-cors' 
        }).catch(() => {}); // We don't care if it fails, we just want the interaction

        // Sync user
        await axios.post("/api/user/sync",
          { clerkId: user.id, fullName: user.fullName, email: user.primaryEmailAddress?.emailAddress, profileImage: user.imageUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Fetch fresh user
        const userRes = await axios.get("/api/user/me", { headers: { Authorization: `Bearer ${token}` } });
        setDbUser(userRes.data);

        // Fetch purchased courses
        const coursesRes = await axios.get("/api/courses/my-courses", { headers: { Authorization: `Bearer ${token}` } });
        const data = coursesRes.data;
        setPurchasedCourses(Array.isArray(data) ? data : data.courses || []);

      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, isLoaded, isSignedIn, getToken, location.state]);

  const toggleTheme = (e) => {
    document.body.classList.toggle("dark-mode");
    setIsDark(document.body.classList.contains("dark-mode"));
    e.currentTarget.classList.toggle("active");
  };

  if (!isLoaded || loading) return (
    <div style={{ padding: 60, textAlign: "center", fontSize: 16, color: "#64748b" }}>
      Loading Dashboard...
    </div>
  );

  if (!isSignedIn) return (
    <div style={{ padding: 60, textAlign: "center", color: "#ef4444" }}>
      Please log in to access the dashboard.
    </div>
  );

  if (!dbUser) return (
    <div style={{ padding: 60, textAlign: "center", color: "#ef4444" }}>
      Error loading profile. Please refresh.
    </div>
  );

  // Access gate
  if (!dbUser.hasPurchased && dbUser.role !== "superadmin") {
    return (
      <div className="dashboard-locked">
        <div className="locked-card">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h2>Access Restricted</h2>
          <p>
            Your dashboard is locked. Enroll in at least one course to unlock
            your student dashboard, quiz, and progress tracking.
          </p>
          <button className="locked-btn" onClick={() => navigate("/courses")}>
            Explore Courses
          </button>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 20, color: "#64748b", fontSize: 13 }}>
            <span>Switch account:</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    );
  }

  const hasPurchasedCourse = dbUser.role === "superadmin" || purchasedCourses.length > 0;
  const totalQuizQuestions = 24;
  const quizProgress = dbUser.quizScore ? Math.round((dbUser.quizScore / totalQuizQuestions) * 100) : 0;
  const courseProgress = purchasedCourses.length > 0 ? (purchasedCourses[0].progress || 0) : 0; 
  const allVideosWatched = courseProgress === 100 || dbUser.role === "superadmin"; 
  const attemptsUsed = dbUser.quizAttempts || 0;
  const canTakeQuiz = !dbUser.quizPassed && attemptsUsed < 3 && allVideosWatched;

  return (
    <div className="dashboard-layout">

      {/* ── Enrollment success banner ── */}
      {justEnrolled && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#10b981", color: "#fff", padding: "14px 28px", borderRadius: 10,
          fontWeight: 600, fontSize: 15, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          cursor: "pointer",
        }} onClick={() => setJustEnrolled(false)}>
          🎉 Enrollment successful! Check your email for your invoice.
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className="dashboard-sidebar">
        <div className="profile-card">
          <UserButton afterSignOutUrl="/" />
          <h4>{dbUser.fullName || "Student"}</h4>
          <p>{dbUser.email}</p>
          <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {dbUser.role === "superadmin" ? "⚡ Superadmin" : "🎓 Student"}
          </span>
        </div>

        <nav className="sidebar-menu">
          <a onClick={() => navigate("/")}>🏠 Home</a>
          <a className="active">📊 Dashboard</a>
          <a onClick={() => navigate("/my-courses")}>📚 My Courses</a>
          <a>🎓 Certificates</a>
          <a>⚙️ Settings</a>
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="dashboard-main">

        {/* Header */}
        <div className="dashboard-header">
          <h1>Student Dashboard</h1>
          <button className="theme-toggle" onClick={toggleTheme}>
            <span className="toggle-icon"></span>
          </button>
        </div>

        {/* Welcome banner */}
        <div className="dashboard-welcome">
          <div>
            <h2>Welcome back, {dbUser.fullName?.split(" ")[0] || "Student"}! 👋</h2>
            <p>Keep up the great work. Your next milestone is just ahead.</p>
          </div>
          {purchasedCourses.length > 0 && (
            <button className="dashboard-welcome-btn" onClick={() => navigate("/my-courses")}>
              Continue Learning →
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card animated">
            <span className="stat-icon">📚</span>
            <h4>Enrolled</h4>
            <span>{dbUser.coursesEnrolled || 0}</span>
          </div>
          <div className="stat-card animated">
            <span className="stat-icon">✅</span>
            <h4>Completed</h4>
            <span>{dbUser.completedCourses || 0}</span>
          </div>
          <div className="stat-card animated">
            <span className="stat-icon">🧠</span>
            <h4>Quiz Score</h4>
            <span style={{ color: dbUser.quizPassed ? "#10b981" : undefined }}>
              {dbUser.quizScore || 0}/{totalQuizQuestions}
            </span>
          </div>
          <div className="stat-card animated">
            <span className="stat-icon">🏆</span>
            <h4>Quiz Status</h4>
            <span style={{ fontSize: 18, color: dbUser.quizPassed ? "#10b981" : "#ef4444" }}>
              {dbUser.quizPassed ? "PASSED ✅" : "PENDING"}
            </span>
          </div>
        </div>

        {/* My Courses — quick preview */}
        {purchasedCourses.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 className="section-heading">My Courses</h2>
              <span
                onClick={() => navigate("/my-courses")}
                style={{ fontSize: 13, color: "#2563eb", cursor: "pointer", fontWeight: 600 }}
              >
                View all →
              </span>
            </div>

            <div className="courses-grid">
              {purchasedCourses.slice(0, 3).map((course) => (
                <div
                  key={course._id}
                  className="course-card animated"
                  onClick={() => navigate(`/my-courses/${course._id}`)}
                >
                  <div className="course-card-thumb">
                    {course.category === "Backend Development" ? "🔗" : "💹"}
                  </div>
                  <div className="course-card-body">
                    <div className="course-card-title">{course.title}</div>
                    <div className="course-card-meta">
                      {course.level?.toUpperCase()} • {course.category || "Professional"}
                    </div>
                    <div className="course-progress-bar-wrap">
                      <div className="course-progress-bar" style={{ width: `${course.progress || 0}%` }} />
                    </div>
                    <div className="course-progress-text">{course.progress || 0}% complete</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Quiz progress + Announcements */}
        <div className="dashboard-grid">
          <div className="glass-card animated center">
            <h3>FinTech Quiz Progress</h3>
            <div className="circle-wrap">
              <CircularProgressbar
                value={quizProgress}
                text={`${quizProgress}%`}
                styles={buildStyles({
                  pathColor: dbUser.quizPassed ? "#10b981" : "#2563eb",
                  textColor: dbUser.quizPassed ? "#10b981" : "#2563eb",
                  trailColor: "#f1f5f9",
                })}
              />
            </div>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
              Attempts: {dbUser.quizAttempts || 0} / 3
            </p>
            {hasPurchasedCourse && (
              <button
                onClick={() => (canTakeQuiz || dbUser.quizPassed) && navigate("/quiz/fintech")}
                disabled={!canTakeQuiz && !dbUser.quizPassed}
                style={{
                  marginTop: 12, 
                  background: canTakeQuiz || dbUser.quizPassed ? "#2563eb" : "rgba(100,116,139,0.4)", 
                  color: "#fff",
                  border: "none", 
                  padding: "10px 24px", 
                  borderRadius: 8,
                  fontWeight: 600, 
                  fontSize: 14, 
                  cursor: canTakeQuiz || dbUser.quizPassed ? "pointer" : "not-allowed",
                  width: "100%"
                }}
              >
                {dbUser.quizPassed 
                  ? "📋 Review Quiz" 
                  : !allVideosWatched 
                    ? "🔒 Watch All Videos to Unlock"
                    : canTakeQuiz 
                      ? "🚀 Take Quiz →" 
                      : "❌ No Attempts Left"}
              </button>
            )}
          </div>

          <div className="glass-card animated">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0" }}>
              <span style={{ fontSize: "22px" }}>🚀</span> Claim Your Internship
            </h3>
            
            <div style={{
              marginTop: "16px",
              padding: "18px",
              background: "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(16,185,129,0.06) 100%)",
              border: "1px solid rgba(37,99,235,0.15)",
              borderLeft: "4px solid #2563eb",
              borderRadius: "10px",
            }}>
              <p style={{ fontWeight: "600", fontSize: "15px", marginBottom: "12px", lineHeight: "1.4" }}>
                Ready to start working? Follow these 3 steps to begin your onboarding:
              </p>
              
              <ol style={{ paddingLeft: "20px", fontSize: "14px", lineHeight: "1.7", marginBottom: "18px", opacity: 0.9 }}>
                <li>Watch <strong>all course videos</strong> to reach 100% completion.</li>
                <li>Pass the final quiz with a <strong>score of 70% or higher</strong>.</li>
                <li>Email a screenshot of your passing score along with your updated CV to <a href="mailto:support@aventratechsolution.com" style={{ color: "#3b82f6", fontWeight: "700", textDecoration: "none" }}>support@aventratechsolution.com</a>.</li>
              </ol>
              
              <div style={{
                background: "rgba(16,185,129,0.12)",
                color: "#10b981",
                padding: "12px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "700",
                textAlign: "center",
                border: "1px solid rgba(16,185,129,0.2)"
              }}>
                ✨ We will process your application and start your internship immediately!
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}