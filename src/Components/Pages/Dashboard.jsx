import React, { useState, useEffect } from "react";
import "../../assets/css/dashboard.css";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { UserButton, useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync + Fetch user
  useEffect(() => {
    // Prevent running until Clerk has finished loading
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    const syncAndGetUser = async () => {
      try {
        const token = await getToken();
        
        const res = await axios.post(
          "http://localhost:3000/api/user/sync",
          {
            clerkId: user.id,
            fullName: user.fullName,
            email: user.primaryEmailAddress?.emailAddress,
            profileImage: user.imageUrl,
          },
          { 
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Your backend returns { message: "...", user: { ... } }
        setDbUser(res.data.user || res.data);

      } catch (err) {
        console.error("Failed to fetch user data:", err);
      } finally {
        setLoading(false);
      }
    };

    syncAndGetUser();
  }, [user, isLoaded, isSignedIn, getToken]);

  if (!isLoaded || loading) return <div style={{ padding: 40, textAlign: "center", fontSize: "18px" }}>Loading Dashboard...</div>;
  if (!isSignedIn) return <div style={{ padding: 40, textAlign: "center", color: "red" }}>Please log in to access the dashboard.</div>;
  if (!dbUser) return <div style={{ padding: 40, textAlign: "center", color: "red" }}>Error loading user profile. Please refresh the page.</div>;

  // ✅ Check if user purchased at least one course
  const hasPurchasedCourse = dbUser.purchasedCourses && dbUser.purchasedCourses.length > 0;

  // ✅ Calculate real quiz progress based on the 24 questions we added
  const totalQuizQuestions = 24;
  const progress = dbUser.quizScore ? Math.round((dbUser.quizScore / totalQuizQuestions) * 100) : 0;

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="profile-card">
          <UserButton afterSignOutUrl="/" />
          <h4>{dbUser.fullName}</h4>
          <p>{dbUser.email}</p>
        </div>

        <nav className="sidebar-menu">
          <a className="active">🏠 Dashboard</a>
          <a onClick={() => navigate("/my-courses")}>📚 My Courses</a>
          <a>📊 Progress</a>

          {/* ✅ Show quiz only if purchased */}
          {hasPurchasedCourse && (
            <a onClick={() => navigate("/quiz/fintech")}>
              🧠 FinTech Quiz
            </a>
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
            <span style={{ fontSize: "18px", color: dbUser.quizPassed ? "#10b981" : "#ef4444" }}>
              {dbUser.quizPassed ? "PASSED ✅" : "PENDING"}
            </span>
          </div>
        </div>

        {/* GRID */}
        <div className="dashboard-grid">
          {/* PROGRESS */}
          <div className="glass-card animated center">
            <h3>FinTech Quiz Progress</h3>

            <div className="circle-wrap" style={{ width: "150px", margin: "20px auto" }}>
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
                <li style={{ color: "#10b981", fontWeight: "bold" }}>🏆 Your FinTech Certificate is ready to download!</li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}