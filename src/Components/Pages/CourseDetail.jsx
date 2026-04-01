import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "../../assets/css/dashboard.css";
import CourseVideoList from "./CourseVideoList";

const FINTECH_COURSE_ID = import.meta.env.VITE_FINTECH_COURSE_ID;

const ODATA_MODULES = [
  { id: 1, title: "OData Protocol Fundamentals", meta: "REST, HTTP, OData Spec v4", icon: "📖", status: "coming" },
  { id: 2, title: "Querying with OData", meta: "$filter, $select, $expand, $orderby", icon: "🔍", status: "coming" },
  { id: 3, title: "Building OData APIs", meta: "Node.js + Express + OData library", icon: "⚙️", status: "coming" },
  { id: 4, title: "Secure Data Integration", meta: "Auth, Rate Limiting, Best Practices", icon: "🔐", status: "coming" },
  { id: 5, title: "Real-world Backend Routing", meta: "Production-grade patterns", icon: "🚀", status: "coming" },
  { id: 6, title: "OData Quiz", meta: "Coming soon", icon: "🧠", status: "coming" },
];

function getCourseType(course) {
  if (!course) return "fintech";
  const title = (course.title || "").toLowerCase();
  const cat = (course.category || "").toLowerCase();
  if (title.includes("odata") || cat.includes("backend")) return "odata";
  return "fintech";
}

function getEmoji(type) {
  return type === "odata" ? "🔗" : "💹";
}

// ── Animated canvas background ──
function AnimatedBackground({ type }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = type === "odata"
      ? { blob1: "rgba(99, 52, 206, 0.18)", blob2: "rgba(14, 165, 233, 0.12)", streak: "rgba(180, 140, 255, 0.10)" }
      : { blob1: "rgba(56, 182, 255, 0.18)", blob2: "rgba(37, 99, 235, 0.12)", streak: "rgba(180, 220, 255, 0.10)" };

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = type === "odata" ? "#06061a" : "#060818";
      ctx.fillRect(0, 0, width, height);

      const g1 = ctx.createRadialGradient(
        width * (0.25 + 0.15 * Math.sin(t * 0.4)), height * 0.5, 0,
        width * (0.25 + 0.15 * Math.sin(t * 0.4)), height * 0.5, width * 0.6
      );
      g1.addColorStop(0, colors.blob1);
      g1.addColorStop(0.5, colors.blob2);
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const g2 = ctx.createRadialGradient(
        width * (0.75 + 0.12 * Math.cos(t * 0.3)), height * 0.35, 0,
        width * (0.75 + 0.12 * Math.cos(t * 0.3)), height * 0.35, width * 0.5
      );
      g2.addColorStop(0, colors.blob2);
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      const streakX = width * (0.1 + 0.8 * ((Math.sin(t * 0.18) + 1) / 2));
      const grad = ctx.createLinearGradient(streakX - 250, 0, streakX + 250, height);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.45, "rgba(255,255,255,0.0)");
      grad.addColorStop(0.5, "rgba(255,255,255,0.09)");
      grad.addColorStop(0.55, colors.streak);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      const gs = 60;
      for (let x = 0; x < width; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = 0; y < height; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

      t += 0.012;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [type]);

  return (
    <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", display: "block", zIndex: 0 }} />
  );
}

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 18,
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
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
        const coursesRes = await axios.get("/api/courses/my-courses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allCourses = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.courses || [];
        const found = allCourses.find((c) => c._id === courseId);
        setCourse(found || null);

        if (found && getCourseType(found) === "fintech") {
          try {
            const quizRes = await axios.get(`/api/quiz/result/${found._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setQuizResult(quizRes.data);
          } catch (_) {}
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
    <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      Loading course...
    </div>
  );

  if (!course) return (
    <div style={{ padding: "80px 0", textAlign: "center" }}>
      <p style={{ color: "#ef4444", marginBottom: 16 }}>Course not found or not enrolled.</p>
      <button onClick={() => navigate("/my-courses")} style={{ color: "#60a5fa", cursor: "pointer", background: "none", border: "none", fontWeight: 600, fontSize: 15 }}>
        ← Back to My Courses
      </button>
    </div>
  );

  const type = getCourseType(course);
  const isFinTech = type === "fintech";
  const isOData = type === "odata";

  // FinTech has real videos — OData still uses static module list
  const hasliveVideos = isFinTech;

  const totalQuizQuestions = 24;
  const quizProgress = quizResult?.score ? Math.round((quizResult.score / totalQuizQuestions) * 100) : 0;
  const quizPassed = quizResult?.passed || false;
  const attemptsUsed = quizResult?.attemptsUsed || 0;
  const canTakeQuiz = !quizPassed && attemptsUsed < 3;

  const textPrimary = "#ffffff";
  const textSecondary = "rgba(255,255,255,0.55)";
  const textMuted = "rgba(255,255,255,0.35)";
  const borderColor = "rgba(255,255,255,0.10)";

  return (
    <div style={{ marginTop: "-120px", minHeight: "100vh", position: "relative" }}>

      <AnimatedBackground type={type} />

      <div style={{ position: "relative", zIndex: 1, paddingTop: "20px", paddingBottom: 60 }}>
        <div className="course-detail-layout">

          {/* Back */}
          <div style={{ marginBottom: 24 }}>
            <button
              className="back-btn"
              onClick={() => navigate("/my-courses")}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff" }}
            >
              ← My Courses
            </button>
          </div>

          {/* Hero banner */}
          <GlassCard style={{
            padding: "32px 36px",
            marginBottom: 28,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}>
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ fontSize: 56, lineHeight: 1 }}>{getEmoji(type)}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 8 }}>{course.title}</h1>
                <p style={{ color: textSecondary, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{course.description}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[course.level?.toUpperCase(),].map((b) => b && (
                    <span key={b} style={{
                      background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)",
                      fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99,
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* ── FinTech: Live video player + quiz sidebar ── */}
          {hasliveVideos && (
            <>
              {/* Full-width video player section */}
              <div style={{ marginBottom: 28 }}>
                <CourseVideoList courseId={courseId} courseName={course.title} />
              </div>

              {/* Below video: quiz + info side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* Quiz card */}
                <GlassCard style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: textPrimary, margin: "0 0 16px" }}>🧠 FinTech Quiz</h3>

                  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, marginBottom: 16 }}>
                    <div style={{ width: 60, flexShrink: 0 }}>
                      <CircularProgressbar
                        value={quizProgress}
                        text={`${quizProgress}%`}
                        styles={buildStyles({
                          pathColor: quizPassed ? "#34d399" : "#60a5fa",
                          textColor: quizPassed ? "#34d399" : "#60a5fa",
                          trailColor: "rgba(255,255,255,0.1)",
                          textSize: "26px",
                        })}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: textMuted }}>Score</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: textPrimary }}>{quizResult?.score || 0} / {totalQuizQuestions}</div>
                      <div style={{ fontSize: 12, color: textMuted }}>Attempts: {attemptsUsed} / 3</div>
                    </div>
                  </div>

                  {quizPassed && (
                    <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#34d399", marginBottom: 12 }}>
                      🏆 Quiz Passed! Certificate ready.
                    </div>
                  )}
                  {quizResult && !quizPassed && attemptsUsed >= 3 && (
                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#f87171", marginBottom: 12 }}>
                      ❌ Max attempts reached. Contact support.
                    </div>
                  )}
                  {quizResult && !quizPassed && attemptsUsed < 3 && (
                    <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#fbbf24", marginBottom: 12 }}>
                      ❌ Not passed. {3 - attemptsUsed} attempt(s) left.
                    </div>
                  )}

                  <button
                    onClick={() => (canTakeQuiz || quizPassed) && navigate("/quiz/fintech")}
                    disabled={!canTakeQuiz && !quizPassed}
                    style={{
                      width: "100%",
                      background: canTakeQuiz || quizPassed ? "rgba(37,99,235,0.8)" : "rgba(100,116,139,0.4)",
                      color: "#ffffff",
                      border: `1px solid ${canTakeQuiz || quizPassed ? "rgba(37,99,235,0.5)" : "rgba(255,255,255,0.1)"}`,
                      padding: "13px 20px", borderRadius: 10, fontSize: 15, fontWeight: 700,
                      cursor: canTakeQuiz || quizPassed ? "pointer" : "not-allowed", minHeight: 48,
                    }}
                  >
                    {quizPassed ? "📋 Review Quiz" : canTakeQuiz ? "🚀 Take Quiz" : "❌ No Attempts Left"}
                  </button>
                  <p style={{ fontSize: 12, color: textMuted, textAlign: "center", margin: "10px 0 0" }}>
                    24 questions • 75% to pass • 3 max attempts
                  </p>
                </GlassCard>

                {/* Course info card */}
                <GlassCard style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: textPrimary, margin: "0 0 16px" }}>📋 Course Info</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {[
                      ["🎯 Level", course.level?.toUpperCase() || "Professional"],
                      ["📂 Category", course.category || "Tech"],
                      ["🎬 Videos", "10 lessons"],
                      ["🏆 Certificate", quizPassed ? "✅ Earned" : "Complete quiz to earn"],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "11px 0", borderBottom: `1px solid ${borderColor}` }}>
                        <span style={{ color: textSecondary }}>{label}</span>
                        <span style={{ fontWeight: 600, color: textPrimary }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate("/my-courses")}
                    style={{
                      width: "100%", marginTop: 16,
                      background: "rgba(255,255,255,0.07)",
                      color: textPrimary, border: `1px solid ${borderColor}`,
                      padding: "11px 20px", borderRadius: 10, fontSize: 14,
                      fontWeight: 600, cursor: "pointer", minHeight: 44,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                  >
                    ← Back to My Courses
                  </button>
                </GlassCard>

              </div>
            </>
          )}

          {/* ── OData: Static module list + info sidebar ── */}
          {isOData && (
            <div className="course-detail-grid">

              {/* Left — Static modules */}
              <GlassCard>
                <div style={{ padding: "20px 24px", borderBottom: `1px solid ${borderColor}` }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: textPrimary, margin: 0 }}>📚 Course Content</h2>
                  <p style={{ fontSize: 13, color: textMuted, margin: "4px 0 0" }}>
                    {ODATA_MODULES.length} modules • Video content coming soon
                  </p>
                </div>

                {ODATA_MODULES.map((mod, i) => (
                  <div
                    key={mod.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "15px 24px",
                      borderBottom: i < ODATA_MODULES.length - 1 ? `1px solid ${borderColor}` : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: "rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                    }}>
                      {mod.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary, marginBottom: 2 }}>{mod.title}</div>
                      <div style={{ fontSize: 12, color: textMuted }}>{mod.meta}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>Coming Soon</div>
                  </div>
                ))}
              </GlassCard>

              {/* Right — Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <GlassCard style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: textPrimary, margin: "0 0 16px" }}>🧠 OData Quiz</h3>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 10, padding: "24px", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🚧</div>
                    <p style={{ fontSize: 14, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
                      Quiz for this course is coming soon. Stay tuned!
                    </p>
                  </div>
                </GlassCard>

                <GlassCard style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: textPrimary, margin: "0 0 16px" }}>📋 Course Info</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {[
                      ["🎯 Level", course.level?.toUpperCase() || "Professional"],
                      ["📂 Category", course.category || "Tech"],
                      ["📦 Modules", `${ODATA_MODULES.length} modules`],
                      ["🎬 Videos", "Coming Soon"],
                      ["🏆 Certificate", "Coming Soon"],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "11px 0", borderBottom: `1px solid ${borderColor}` }}>
                        <span style={{ color: textSecondary }}>{label}</span>
                        <span style={{ fontWeight: 600, color: textPrimary }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate("/my-courses")}
                    style={{
                      width: "100%", marginTop: 16,
                      background: "rgba(255,255,255,0.07)",
                      color: textPrimary, border: `1px solid ${borderColor}`,
                      padding: "11px 20px", borderRadius: 10, fontSize: 14,
                      fontWeight: 600, cursor: "pointer", minHeight: 44,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                  >
                    ← Back to My Courses
                  </button>
                </GlassCard>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}