import React, { useState, useEffect } from "react";
import "../../assets/css/dashboard.css";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { UserButton, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {

  const { user } = useUser();
  const navigate = useNavigate();

  const progress = 68;

  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync + Fetch user
  useEffect(() => {

    if (!user) return;

    const syncAndGetUser = async () => {

      try {

        const res = await axios.post(
          "http://localhost:3000/api/user/sync",
          {
            clerkId: user.id,
            fullName: user.fullName,
            email: user.primaryEmailAddress?.emailAddress,
            profileImage: user.imageUrl,
          },
          { withCredentials: true }
        );

        setDbUser(res.data);

      } catch (err) {

        console.error("Failed:", err);

      } finally {

        setLoading(false);

      }
    };

    syncAndGetUser();

  }, [user]);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!dbUser) return <div style={{ padding: 40 }}>Error loading user</div>;


  // ✅ Check if user purchased at least one course
  const hasPurchasedCourse =
    dbUser.purchasedCourses && dbUser.purchasedCourses.length > 0;


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

          <a onClick={() => navigate("/my-courses")}>
            📚 My Courses
          </a>

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
            <span>{dbUser.coursesEnrolled}</span>
          </div>

          <div className="stat-card animated">
            <h4>Completed</h4>
            <span>{dbUser.completedCourses}</span>
          </div>

          <div className="stat-card animated">
            <h4>Internship</h4>
            <span>{dbUser.internshipProgress}%</span>
          </div>

          <div className="stat-card animated">
            <h4>Certificates</h4>
            <span>{dbUser.certificates}</span>
          </div>

        </div>


        {/* GRID */}
        <div className="dashboard-grid">

          {/* PROGRESS */}
          <div className="glass-card animated center">

            <h3>Overall Progress</h3>

            <div className="circle-wrap">

              <CircularProgressbar
                value={progress}
                text={`${progress}%`}
                styles={buildStyles({
                  pathColor: "#38bdf8",
                  textColor: "#38bdf8",
                  trailColor: "rgba(255,255,255,0.1)",
                })}
              />

            </div>

          </div>


          {/* ANNOUNCEMENTS */}
          <div className="glass-card animated">

            <h3>📢 Announcements</h3>

            <ul>
              <li>🚀 Internship onboarding starts next week.</li>
              <li>📘 New React course launching soon.</li>
              <li>🎯 Resume workshop on Friday.</li>
            </ul>

          </div>

        </div>

      </main>

    </div>
  );
}