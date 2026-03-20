import React, { useEffect, useState, useRef } from "react";
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
  return "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)";
}

// ── Animated canvas background (WebGL-style light sweep) ──
function AnimatedBackground() {
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

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Dark base
      ctx.fillStyle = "#060818";
      ctx.fillRect(0, 0, width, height);

      // Sweeping light arc 1 — blue/cyan
      const g1 = ctx.createRadialGradient(
        width * (0.3 + 0.2 * Math.sin(t * 0.4)), height * 0.6,
        0,
        width * (0.3 + 0.2 * Math.sin(t * 0.4)), height * 0.6,
        width * 0.7
      );
      g1.addColorStop(0, "rgba(56, 182, 255, 0.18)");
      g1.addColorStop(0.4, "rgba(37, 99, 235, 0.10)");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      // Sweeping light arc 2 — purple
      const g2 = ctx.createRadialGradient(
        width * (0.7 + 0.15 * Math.cos(t * 0.3)), height * 0.3,
        0,
        width * (0.7 + 0.15 * Math.cos(t * 0.3)), height * 0.3,
        width * 0.6
      );
      g2.addColorStop(0, "rgba(139, 92, 246, 0.14)");
      g2.addColorStop(0.5, "rgba(99, 52, 206, 0.07)");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // Light streak — the rainbow sweep
      const streakX = width * (0.1 + 0.8 * ((Math.sin(t * 0.2) + 1) / 2));
      const grad = ctx.createLinearGradient(streakX - 300, 0, streakX + 300, height);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.3, "rgba(255,255,255,0.0)");
      grad.addColorStop(0.48, "rgba(180, 220, 255, 0.06)");
      grad.addColorStop(0.5, "rgba(255, 255, 255, 0.12)");
      grad.addColorStop(0.52, "rgba(180, 160, 255, 0.06)");
      grad.addColorStop(0.7, "rgba(255,255,255,0.0)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      t += 0.015;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
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
    <div style={{
      marginTop: "-120px",
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* ── Animated background ── */}
      <AnimatedBackground />

      {/* ── Content layer ── */}
      <div style={{ position: "relative", zIndex: 1, paddingTop: "20px", paddingBottom: 60 }}>
        <div className="my-courses-layout">

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <button
              className="back-btn"
              onClick={() => navigate("/dashboard")}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#ffffff",
                marginBottom: 20,
              }}
            >
              ← Dashboard
            </button>

            <h1 style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.04em",
              marginBottom: 8,
              lineHeight: 1.1,
            }}>
              My Learning
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: 0 }}>
              {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled
            </p>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading your courses...</p>
            </div>
          )}

          {!loading && courses.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
              <h3 style={{ color: "#ffffff", marginBottom: 8 }}>No courses yet</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
                You haven't enrolled in any courses. Start learning today!
              </p>
              <button
                onClick={() => navigate("/courses")}
                style={{
                  background: "#2563eb", color: "#fff", border: "none",
                  padding: "12px 28px", borderRadius: 8, fontWeight: 700,
                  fontSize: 15, cursor: "pointer",
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
                  onClick={() => navigate(`/my-courses/${course._id}`)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 18,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                    e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    height: 160,
                    background: getGradient(course),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 52,
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    {/* Subtle inner glow */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)",
                    }} />
                    <span style={{ position: "relative", zIndex: 1 }}>{getEmoji(course)}</span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "20px 22px 22px" }}>
                    <span style={{
                      display: "inline-block",
                      background: "rgba(37,99,235,0.3)",
                      color: "#93c5fd",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 99,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 10,
                      border: "1px solid rgba(37,99,235,0.4)",
                    }}>
                      {course.level?.toUpperCase() || "PROFESSIONAL"}
                    </span>

                    <h3 style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: 8,
                      lineHeight: 1.4,
                    }}>
                      {course.title}
                    </h3>

                    <p style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: 14,
                      lineHeight: 1.5,
                    }}>
                      {course.description?.slice(0, 80)}...
                    </p>

                    {/* Progress */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                        <span>Progress</span>
                        <span>0%</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 5, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "0%", background: "#2563eb", borderRadius: 99 }} />
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>
                      <span>📂 {course.category || "Professional"}</span>
                      <span>💰 ₹{course.price?.toLocaleString()}</span>
                    </div>

                    <button
                      style={{
                        width: "100%",
                        background: "rgba(37,99,235,0.8)",
                        backdropFilter: "blur(10px)",
                        color: "#ffffff",
                        border: "1px solid rgba(37,99,235,0.5)",
                        padding: "11px",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.2s",
                        minHeight: 44,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(37,99,235,1)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(37,99,235,0.8)"}
                    >
                      Continue Learning →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}