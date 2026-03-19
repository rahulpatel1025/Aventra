import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import "../../assets/css/dashboard.css";

function getEmoji(course) {
  const title = (course.title || "").toLowerCase();
  const cat = (course.category || "").toLowerCase();
  if (title.includes("odata") || cat.includes("backend")) return "🔗";
  if (title.includes("fintech")) return "💹";
  if (title.includes("ai") || title.includes("ml")) return "🤖";
  return "📘";
}

function getGradient(course) {
  const title = (course.title || "").toLowerCase();
  if (title.includes("odata")) return "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)";
  if (title.includes("fintech")) return "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)";
  return "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)";
}

export default function MyCourses() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = await getToken();
        const res = await axios.get("/api/courses/my-courses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setCourses(Array.isArray(data) ? data : data.courses || []);
      } catch (err) {
        console.error("Failed to fetch my courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [getToken]);

  return (
    // ── Negative margin-top cancels the body's 120px padding-top from styles.css ──
    <div style={{ marginTop: "-120px", paddingTop: "20px", minHeight: "100vh", background: "#f8fafc" }}>
      <div className="my-courses-layout">

        {/* Header */}
        <div className="my-courses-header">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ← Dashboard
          </button>
          <div>
            <h1 className="my-courses-title">My Learning</h1>
            <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
              {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled
            </p>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p style={{ color: "#64748b" }}>Loading your courses...</p>
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
            <h3 style={{ color: "#0f172a", marginBottom: 8 }}>No courses yet</h3>
            <p>You haven't enrolled in any courses. Start learning today!</p>
            <button
              onClick={() => navigate("/courses")}
              style={{
                background: "#2563eb", color: "#fff", border: "none",
                padding: "12px 28px", borderRadius: 8, fontWeight: 700,
                fontSize: 15, cursor: "pointer", marginTop: 8,
              }}
            >
              Explore Courses
            </button>
          </div>
        )}

        {!loading && courses.length > 0 && (
          <div className="courses-grid-full">
            {courses.map((course) => (
              <div
                key={course._id}
                className="course-card-full animated"
                onClick={() => navigate(`/my-courses/${course._id}`)}
              >
                {/* Thumbnail */}
                <div
                  className="course-card-thumb-full"
                  style={{ background: getGradient(course) }}
                >
                  <span style={{ fontSize: 52 }}>{getEmoji(course)}</span>
                </div>

                <div className="course-card-body-full">
                  <span className="course-badge">
                    {course.level?.toUpperCase() || "PROFESSIONAL"}
                  </span>

                  <h3>{course.title}</h3>

                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12, lineHeight: 1.5 }}>
                    {course.description?.slice(0, 85)}...
                  </p>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                      <span>Progress</span>
                      <span>0%</span>
                    </div>
                    <div className="course-progress-bar-wrap">
                      <div className="course-progress-bar" style={{ width: "0%" }} />
                    </div>
                  </div>

                  {/* Meta row */}
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#94a3b8", margin: "10px 0 14px" }}>
                    <span>📂 {course.category || "Professional"}</span>
                    <span>💰 ₹{course.price?.toLocaleString()}</span>
                  </div>

                  <button className="continue-btn">
                    Continue Learning →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}