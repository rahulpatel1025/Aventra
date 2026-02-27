import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import DashboardCTA from "./DashboardCTA";
import FinTechCourse from "../Course/FinTechCourse";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch published courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3000/courses"
        );
        setCourses(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <>
      <DashboardCTA />

      {/* *********** CATEGORY ************** */}
      <div className="container-xxl py-5 category">
        <div className="container">

          <div className="text-center wow fadeInUp">
            <h6 className="section-title bg-white text-center text-primary px-3">
              Categories
            </h6>
            <h1 className="mb-5 gradient-text">
              Courses Categories
            </h1>
          </div>

          <div className="row g-5 align-items-center">

            {/* LEFT CONTENT */}
            <div className="col-lg-7">
              <div className="what-you-get-card">
                <h2>What You Get</h2>

                <h4>
                  Why students choose <span>Aventra Tech Solutions</span>
                </h4>

                <p className="highlight">
                  ✅ You’ll get <strong>100% paid internship after completion</strong> —
                  else your money back.
                </p>

                <ul>
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
                className="d-block rounded overflow-hidden"
                to="/courses"
              >
                <img
                  className="img-fluid w-100"
                  src="/img/cat-4.jpg"
                  alt="Courses Preview"
                  style={{
                    maxHeight: "420px",
                    objectFit: "cover",
                  }}
                />
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ************** COURSES SECTION ************** */}
      <div className="container-xxl py-5">
        <div className="container">

          <div className="text-center wow fadeInUp">
            <h6 className="section-title bg-white text-center text-primary px-3">
              Programs
            </h6>
            <h1 className="mb-5 gradient-text">
              Delivery-Focused Professional Programs
            </h1>
          </div>

          {/* 🔥 Loading */}
          {loading && (
            <p style={{ textAlign: "center" }}>
              ⏳ Loading courses...
            </p>
          )}

          {/* ❌ No courses */}
          {!loading && courses.length === 0 && (
            <p style={{ textAlign: "center" }}>
              No courses available yet.
            </p>
          )}

          {/* ✅ Dynamic Courses */}
          {!loading &&
            courses.map((course) => (
              <FinTechCourse
                key={course._id}
                course={course}
              />
            ))}

        </div>
      </div>

      {/* 🚀 Coming Soon Section */}
      <div className="container-xxl py-5">
        <div className="container">
          <div className="coming-soon-card">
            <h2>
              <span>🚀 Many more courses coming soon!</span>
            </h2>
            <p>
              We're continuously building high-quality courses to help you level up
              your skills. Stay tuned for exciting new content, expert-led programs,
              and career-focused learning paths.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
