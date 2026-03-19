import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "../../assets/css/dashboard.css";

// ── Course module definitions ──
const FINTECH_MODULES = [
  { id: 1, title: "Introduction to FinTech", meta: "Overview & Industry Landscape", icon: "📖", status: "coming" },
  { id: 2, title: "Digital Payment Systems", meta: "UPI, Cards, Wallets", icon: "💳", status: "coming" },
  { id: 3, title: "Banking & Lending Tech", meta: "Neobanks, Credit Scoring", icon: "🏦", status: "coming" },
  { id: 4, title: "Blockchain & Crypto", meta: "DeFi, Smart Contracts", icon: "⛓️", status: "coming" },
  { id: 5, title: "RegTech & Compliance", meta: "KYC, AML, Risk Management", icon: "📋", status: "coming" },
  { id: 6, title: "InsurTech & WealthTech", meta: "Robo-advisors, Digital Insurance", icon: "📊", status: "coming" },
  { id: 7, title: "FinTech Quiz", meta: "24 questions • 75% to pass", icon: "🧠", status: "available" },
];

const ODATA_MODULES = [
  { id: 1, title: "OData Protocol Fundamentals", meta: "REST, HTTP, OData Spec v4", icon: "📖", status: "coming" },
  { id: 2, title: "Querying with OData", meta: "$filter, $select, $expand, $orderby", icon: "🔍", status: "coming" },
  { id: 3, title: "Building OData APIs", meta: "Node.js + Express + OData library", icon: "⚙️", status: "coming" },
  { id: 4, title: "Secure Data Integration", meta: "Auth, Rate Limiting, Best Practices", icon: "🔐", status: "coming" },
  { id: 5, title: "Real-world Backend Routing", meta: "Production-grade patterns", icon: "🚀", status: "coming" },
  { id: 6, title: "OData Quiz", meta: "Coming soon", icon: "🧠", status: "coming" },
];

function getCourseType(course) {
  if (!course) return "other";
  const title = (course.title || "").toLowerCase();
  const cat = (course.category || "").toLowerCase();
  if (title.includes("odata") || cat.includes("backend")) return "odata";
  if (title.includes("fintech")) return "fintech";
  return "fintech"; // default
}

function getEmoji(type) {
  if (type === "odata") return "🔗";
  if (type === "fintech") return "💹";
  return "📘";
}

function getGradient(type) {
  if (type === "odata") return "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)";
  return "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)";
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [course, setCourse] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();

        // Get purchased courses and find this one
        const coursesRes = await axios.get("/api/courses/my-courses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allCourses = Array.isArray(coursesRes.data)
          ? coursesRes.data
          : coursesRes.data.courses || [];
        const found = allCourses.find((c) => c._id === courseId);
        setCourse(found || null);

        // Fetch quiz result only for FinTech course
        if (found) {
          const type = getCourseType(found);
          if (type === "fintech") {
            try {
              const quizRes = await axios.get(`/api/quiz/result/${found._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setQuizResult(quizRes.data);
            } catch (_) {
              // No quiz result yet
            }
          }
        }
      } catch (err) {
        console.error("CourseDetail fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, getToken]);

  if (loading) return (
    <div style={{ padding: "80px 0", textAlign: "center", color: "#64748b" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      Loading course...
    </div>
  );

  if (!course) return (
    <div style={{ padding: "80px 0", textAlign: "center" }}>
      <p style={{ color: "#ef4444", marginBottom: 16 }}>Course not found or not enrolled.</p>
      <button
        onClick={() => navigate("/my-courses")}
        style={{ color: "#2563eb", cursor: "pointer", background: "none", border: "none", fontWeight: 600, fontSize: 15 }}
      >
        ← Back to My Courses
      </button>
    </div>
  );

  const type = getCourseType(course);
  const isFinTech = type === "fintech";
  const isOData = type === "odata";
  const modules = type === "odata" ? ODATA_MODULES : FINTECH_MODULES;

  const totalQuizQuestions = 24;
  const quizProgress = quizResult?.score
    ? Math.round((quizResult.score / totalQuizQuestions) * 100)
    : 0;
  const quizPassed = quizResult?.passed || false;
  const attemptsUsed = quizResult?.attemptsUsed || 0;
  const canTakeQuiz = !quizPassed && attemptsUsed < 3;

  return (
    // ── Negative margin-top cancels body's 120px padding-top ──
    <div style={{ marginTop: "-120px", paddingTop: "20px", minHeight: "100vh", background: "#f8fafc" }}>
      <div className="course-detail-layout">

        {/* Back nav */}
        <div style={{ marginBottom: 20 }}>
          <button className="back-btn" onClick={() => navigate("/my-courses")}>
            ← My Courses
          </button>
        </div>

        {/* Hero banner */}
        <div className="course-detail-hero" style={{ background: getGradient(type) }}>
          <div className="course-detail-icon">{getEmoji(type)}</div>
          <div className="course-detail-info">
            <h1>{course.title}</h1>
            <p>{course.description}</p>
            <div className="course-detail-badges">
              <span className="detail-badge">{course.level?.toUpperCase() || "PROFESSIONAL"}</span>
              <span className="detail-badge">{course.category || "Course"}</span>
              <span className="detail-badge">₹{course.price?.toLocaleString()}</span>
              <span className="detail-badge">{modules.length} Modules</span>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="course-detail-grid">

          {/* Left — Modules */}
          <div className="modules-card">
            <div className="modules-card-header">
              <h2>📚 Course Content</h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                {modules.length} modules • Video content coming soon
              </p>
            </div>

            {modules.map((mod) => (
              <div key={mod.id} className="module-item">
                <div className="module-icon">{mod.icon}</div>
                <div className="module-info">
                  <div className="module-title">{mod.title}</div>
                  <div className="module-meta">{mod.meta}</div>
                </div>
                <div className={`module-status ${mod.status === "available" ? "done" : "coming"}`}>
                  {mod.status === "available" ? "✓ Available" : "Coming Soon"}
                </div>
              </div>
            ))}
          </div>

          {/* Right — Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* FinTech Quiz card */}
            {isFinTech && (
              <div className="actions-card">
                <h3>🧠 FinTech Quiz</h3>

                <div className="progress-ring-wrap">
                  <div style={{ width: 60 }}>
                    <CircularProgressbar
                      value={quizProgress}
                      text={`${quizProgress}%`}
                      styles={buildStyles({
                        pathColor: quizPassed ? "#10b981" : "#2563eb",
                        textColor: quizPassed ? "#10b981" : "#2563eb",
                        trailColor: "#f1f5f9",
                        textSize: "26px",
                      })}
                    />
                  </div>
                  <div>
                    <div className="progress-ring-label">Score</div>
                    <div className="progress-ring-value">
                      {quizResult?.score || 0} / {totalQuizQuestions}
                    </div>
                    <div className="progress-ring-label">
                      Attempts: {attemptsUsed} / 3
                    </div>
                  </div>
                </div>

                {quizPassed && (
                  <div className="quiz-result-badge">
                    🏆 Quiz Passed! Certificate ready.
                  </div>
                )}
                {quizResult && !quizPassed && attemptsUsed >= 3 && (
                  <div className="quiz-result-badge failed">
                    ❌ Max attempts reached. Contact support.
                  </div>
                )}
                {quizResult && !quizPassed && attemptsUsed < 3 && (
                  <div className="quiz-result-badge failed">
                    ❌ Not passed. {3 - attemptsUsed} attempt(s) left.
                  </div>
                )}

                <button
                  className={`action-primary-btn${!canTakeQuiz && !quizPassed ? " disabled" : ""}`}
                  onClick={() => (canTakeQuiz || quizPassed) && navigate("/quiz/fintech")}
                  disabled={!canTakeQuiz && !quizPassed}
                >
                  {quizPassed ? "📋 Review Quiz" : canTakeQuiz ? "🚀 Take Quiz" : "❌ No Attempts Left"}
                </button>

                <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                  24 questions • 75% to pass • 3 max attempts
                </p>
              </div>
            )}

            {/* OData — Quiz coming soon card */}
            {isOData && (
              <div className="actions-card">
                <h3>🧠 OData Quiz</h3>
                <div style={{
                  background: "#f8fafc", border: "1px dashed #e2e8f0",
                  borderRadius: 10, padding: "20px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🚧</div>
                  <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                    Quiz for this course is coming soon. Stay tuned!
                  </p>
                </div>
              </div>
            )}

            {/* Course info */}
            <div className="actions-card">
              <h3>📋 Course Info</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  ["🎯 Level", course.level?.toUpperCase() || "Professional"],
                  ["📂 Category", course.category || "Tech"],
                  ["📦 Modules", `${modules.length} modules`],
                  ["🎬 Videos", "Coming Soon"],
                  ["🏆 Certificate", isFinTech ? (quizPassed ? "✅ Earned" : "On quiz pass") : "Coming Soon"],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: 13, paddingBottom: 10,
                    borderBottom: "1px solid #f1f5f9",
                  }}>
                    <span style={{ color: "#64748b" }}>{label}</span>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>{value}</span>
                  </div>
                ))}
              </div>

              <button
                className="action-secondary-btn"
                style={{ marginTop: 16 }}
                onClick={() => navigate("/my-courses")}
              >
                ← Back to My Courses
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}