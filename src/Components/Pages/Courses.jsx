import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import DashboardCTA from "./DashboardCTA";
import FinTechCourse from "../Course/FinTechCourse";
import AIMLCourseCard from "../Course/AIMLCourseCard";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(
    () => document.body.classList.contains("dark-mode")
  );

  // Sync dark mode state when user toggles theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains("dark-mode"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("/api/courses");
        const data = res.data;
        setCourses(Array.isArray(data) ? data : data.courses || data.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch courses:", err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // ── Theme-aware banner styles ──
  const banner = {
    dark: {
      wrapper: {
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #0f172a 100%)",
        border: "1px solid rgba(37,99,235,0.35)",
      },
      title: { color: "#ffffff" },
      sub: { color: "rgba(255,255,255,0.6)" },
      hlCyan: { color: "#22d3ee" },
      hlGreen: { color: "#4ade80" },
      hlWhite: { color: "rgba(255,255,255,0.9)", fontWeight: 600 },
      chip: {
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.8)",
      },
      chipGreen: {
        background: "rgba(74,222,128,0.08)",
        border: "1px solid rgba(74,222,128,0.3)",
        color: "#4ade80",
      },
      chipBlue: {
        background: "rgba(96,165,250,0.08)",
        border: "1px solid rgba(96,165,250,0.35)",
        color: "#93c5fd",
      },
      iconFilter: "drop-shadow(0 0 12px rgba(34,211,238,0.5))",
    },
    light: {
      wrapper: {
        background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 55%, #eff6ff 100%)",
        border: "1px solid rgba(37,99,235,0.25)",
      },
      title: { color: "#0f172a" },
      sub: { color: "#475569" },
      hlCyan: { color: "#0891b2" },
      hlGreen: { color: "#15803d" },
      hlWhite: { color: "#0f172a", fontWeight: 600 },
      chip: {
        background: "#ffffff",
        border: "1px solid rgba(37,99,235,0.2)",
        color: "#334155",
      },
      chipGreen: {
        background: "#f0fdf4",
        border: "1px solid #86efac",
        color: "#15803d",
      },
      chipBlue: {
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        color: "#1d4ed8",
      },
      iconFilter: "drop-shadow(0 0 8px rgba(37,99,235,0.25))",
    },
  };

  const t = isDark ? banner.dark : banner.light;

  return (
    <>
      <style>{`
        @keyframes bannerPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.12), 0 8px 32px rgba(37,99,235,0.10); }
          50%       { box-shadow: 0 0 0 8px rgba(37,99,235,0), 0 12px 40px rgba(37,99,235,0.20); }
        }
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .internship-banner {
          position: relative;
          border-radius: 20px;
          padding: 28px 36px;
          margin-bottom: 8px;
          overflow: hidden;
          animation: bannerPulse 3s ease-in-out infinite;
          transition: background 0.4s ease, border 0.4s ease;
        }
        .internship-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255,255,255,0.07) 50%,
            transparent 70%
          );
          background-size: 600px 100%;
          animation: shimmer 4s ease-in-out infinite;
          pointer-events: none;
          border-radius: 20px;
        }
        .internship-banner::after {
          content: '';
          position: absolute;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%);
          top: -100px; right: -60px;
          pointer-events: none;
        }
        .banner-grid-lines {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          border-radius: 20px;
        }
        .banner-inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
          text-align: center;
        }
        .banner-chips {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 14px;
        }
        .banner-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 99px;
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          transition: background 0.3s, border 0.3s, color 0.3s;
        }
      `}</style>

      <DashboardCTA />

      {/* ── CATEGORY ── */}
      <div className="container-xxl py-5 category">
        <div className="container">
          <div className="text-center wow fadeInUp" style={{ marginBottom: "60px" }}>
            <span className="hero-tagline" style={{ display: "inline-block", marginBottom: "16px" }}>
              Categories
            </span>
            <h1 className="hero-title" style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)" }}>
              Courses Categories
            </h1>
          </div>

          <div className="row g-5 align-items-center">
            <div className="col-lg-7">
              <div className="what-you-get-card bento-card">
                <h2 style={{ fontSize: "28px", letterSpacing: "-0.03em" }}>What You Get</h2>
                <h4 style={{ fontWeight: 500, color: "#475569", marginBottom: "24px" }}>
                  Why students choose
                  <span style={{ color: "#0f172a", fontWeight: 700 }}> Aventra Tech Solutions</span>
                </h4>
                <p className="highlight" style={{ background: "rgba(15,23,42,0.04)", borderLeftColor: "#0f172a", color: "#0f172a" }}>
                  You'll get <strong>100% paid internship after completion</strong> — else your money back.
                </p>
                <ul style={{ color: "#475569" }}>
                  <li>Industry-aligned curriculum built for real-world delivery.</li>
                  <li>Hands-on projects following production-grade standards.</li>
                  <li>Mentorship from experienced engineers and architects.</li>
                  <li>Real client-style workflows, documentation &amp; reviews.</li>
                  <li>Resume-ready portfolio and deployment exposure.</li>
                  <li>Career guidance, interview preparation and placement support.</li>
                </ul>
              </div>
            </div>

            <div className="col-lg-5">
              <Link className="d-block rounded-4 overflow-hidden" to="/courses" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                <img
                  className="img-fluid w-100"
                  src="/img/cat-4.jpg"
                  alt="Courses Preview"
                  style={{ maxHeight: "480px", objectFit: "cover", transition: "transform 0.5s ease" }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                  onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── COURSES SECTION ── */}
      <div className="container-xxl py-5">
        <div className="container">

          <div className="text-center wow fadeInUp" style={{ marginBottom: "60px" }}>
            <span className="hero-tagline" style={{ display: "inline-block", marginBottom: "16px" }}>
              Programs
            </span>
            <h1 className="hero-title" style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)" }}>
              Delivery-Focused Professional Programs
            </h1>
          </div>

          {loading && (
            <p style={{ textAlign: "center", color: "#475569" }}>⏳ Loading courses...</p>
          )}

          {/* ── INTERNSHIP ELIGIBILITY BANNER ── */}
          {!loading && (
            <div className="internship-banner" style={t.wrapper}>
              <div className="banner-grid-lines" />
              <div className="banner-inner">

                <div style={{ fontSize: 38, flexShrink: 0, filter: t.iconFilter }}>🏆</div>

                <div style={{ flex: 1, minWidth: 260 }}>
                  {/* Title */}
                  <div style={{
                    fontFamily: "'Syne', 'Inter', sans-serif",
                    fontSize: "clamp(16px, 2vw, 20px)",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.3,
                    marginBottom: 10,
                    ...t.title,
                  }}>
                    Earn a{" "}
                    <span style={t.hlCyan}>100% Stipend-Based Internship</span>
                    {" "}at a{" "}
                    <span style={t.hlGreen}>Real Tech Firm</span>
                    {" "}— applicable across all programs
                  </div>

                  {/* Subtitle */}
                  <div style={{ fontSize: "clamp(12px, 1.4vw, 14px)", lineHeight: 1.65, ...t.sub }}>
                    Complete your course and pass the final assessment with a{" "}
                    <span style={t.hlWhite}>minimum score of 70%</span>
                    {" "}to unlock your internship placement.{" "}
                    <span style={t.hlWhite}>No placement = full refund.</span>
                  </div>

                  {/* Chips */}
                  <div className="banner-chips">
                    <span className="banner-chip" style={t.chipGreen}>✅ All Courses Eligible</span>
                    <span className="banner-chip" style={t.chipBlue}>📝 70%+ Assessment Score Required</span>
                    <span className="banner-chip" style={t.chipGreen}>💼 Paid Internship Guaranteed</span>
                    <span className="banner-chip" style={t.chip}>↩️ Money-Back if Not Placed</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* COURSE GRID */}
          <div className="row g-4 justify-content-center align-items-stretch">
            {!loading && courses.map((course) => (
              <div className="col-lg-4 col-md-6 d-flex" key={course._id}>
                <FinTechCourse course={course} />
              </div>
            ))}
            {!loading && (
              <div className="col-lg-4 col-md-6 d-flex">
                <AIMLCourseCard />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── COMING SOON ── */}
      <div className="container-xxl py-5">
        <div className="container">
          <div
            className="coming-soon-card bento-card"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}
          >
            <h2 style={{ letterSpacing: "-0.03em" }}>
              <span>🚀 Many more courses coming soon!</span>
            </h2>
            <p style={{ color: "#475569" }}>
              We're continuously building high-quality courses to help you level up your skills.
              Stay tuned for exciting new content, expert-led programs, and career-focused learning paths.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}