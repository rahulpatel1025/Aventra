import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import DashboardCTA from "./DashboardCTA";
import FinTechCourse from "../Course/FinTechCourse";

/* NEW COMPONENT IMPORTS */
import ODataCourseCard from "../Course/ODataCourseCard";
import AIMLCourseCard from "../Course/AIMLCourseCard";

export default function Courses() {

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch published courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("http://localhost:3000/courses");
        setCourses(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Hardcoded OData Course (same logic preserved)
  const odataCourse = {
    _id: "static-odata",
    title: "OData Integration & API Development",
    description:
      "Learn to build, deploy, and consume highly scalable RESTful APIs using the industry-standard OData protocol.",
    level: "ADVANCED",
    price: 50000,
    features: [
      "Advanced RESTful API Design",
      "OData V4 Protocol Deep-Dive",
      "Secure Data Integration Workflows",
      "Real-world Backend Routing",
    ],
  };

  return (
    <>
      <DashboardCTA />

      {/* *********** CATEGORY ************** */}
      <div className="container-xxl py-5 category">
        <div className="container">

          <div
            className="text-center wow fadeInUp"
            style={{ marginBottom: "60px" }}
          >
            <span
              className="hero-tagline"
              style={{ display: "inline-block", marginBottom: "16px" }}
            >
              Categories
            </span>

            <h1
              className="hero-title"
              style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)" }}
            >
              Courses Categories
            </h1>
          </div>

          <div className="row g-5 align-items-center">

            {/* LEFT CONTENT */}
            <div className="col-lg-7">
              <div className="what-you-get-card bento-card">
                <h2
                  style={{
                    fontSize: "28px",
                    letterSpacing: "-0.03em",
                  }}
                >
                  What You Get
                </h2>

                <h4
                  style={{
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: "24px",
                  }}
                >
                  Why students choose
                  <span
                    style={{
                      color: "#0f172a",
                      fontWeight: 700,
                    }}
                  >
                    {" "}
                    Aventra Tech Solutions
                  </span>
                </h4>

                <p
                  className="highlight"
                  style={{
                    background: "rgba(15, 23, 42, 0.04)",
                    borderLeftColor: "#0f172a",
                    color: "#0f172a",
                  }}
                >
                  You’ll get <strong>100% paid internship after completion</strong>
                  — else your money back.
                </p>

                <ul style={{ color: "#475569" }}>
                  <li>Industry-aligned curriculum built for real-world delivery.</li>
                  <li>Hands-on projects following production-grade standards.</li>
                  <li>Mentorship from experienced engineers and architects.</li>
                  <li>Real client-style workflows, documentation & reviews.</li>
                  <li>Resume-ready portfolio and deployment exposure.</li>
                  <li>Career guidance, interview preparation and placement support.</li>
                </ul>
              </div>
            </div>

            {/* RIGHT IMAGE */}
            <div className="col-lg-5">
              <Link
                className="d-block rounded-4 overflow-hidden"
                to="/courses"
                style={{ border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <img
                  className="img-fluid w-100 transition-scale"
                  src="/img/cat-4.jpg"
                  alt="Courses Preview"
                  style={{
                    maxHeight: "480px",
                    objectFit: "cover",
                    transition: "transform 0.5s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "scale(1.03)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ************** COURSES SECTION ************** */}
      <div className="container-xxl py-5">
        <div className="container">

          <div
            className="text-center wow fadeInUp"
            style={{ marginBottom: "60px" }}
          >
            <span
              className="hero-tagline"
              style={{ display: "inline-block", marginBottom: "16px" }}
            >
              Programs
            </span>

            <h1
              className="hero-title"
              style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)" }}
            >
              Delivery-Focused Professional Programs
            </h1>
          </div>

          {loading && (
            <p style={{ textAlign: "center", color: "#475569" }}>
              ⏳ Loading courses...
            </p>
          )}

          {/* COURSE GRID */}
          <div className="row g-4 justify-content-center align-items-stretch">

            {/* ODATA COURSE */}
            {!loading && (
              <div className="col-lg-4 col-md-6 d-flex">
                <ODataCourseCard course={odataCourse} />
              </div>
            )}

            {/* FINTECH COURSES (BACKEND DATA) */}
            {!loading &&
              courses.map((course) => (
                <div className="col-lg-4 col-md-6 d-flex" key={course._id}>
                  <FinTechCourse course={course} />
                </div>
              ))}

            {/* AI / ML COURSE */}
            {!loading && (
              <div className="col-lg-4 col-md-6 d-flex">
                <AIMLCourseCard />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 🚀 Coming Soon Section */}
      <div className="container-xxl py-5">
        <div className="container">

          <div
            className="coming-soon-card bento-card"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ letterSpacing: "-0.03em" }}>
              <span>🚀 Many more courses coming soon!</span>
            </h2>

            <p style={{ color: "#475569" }}>
              We're continuously building high-quality courses to help you
              level up your skills. Stay tuned for exciting new content,
              expert-led programs, and career-focused learning paths.
            </p>

          </div>

        </div>
      </div>
    </>
  );
}