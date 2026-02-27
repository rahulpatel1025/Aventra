import React from "react";
import { Link } from "react-router-dom";
import "../../assets/css/moto.css";

export default function CoursesToHire() {
  return (
    <section className="moto-section">
      <div className="moto-container">
        <div className="moto-card">
          <h2>Courses to Hire</h2>

          <p>
            Upskill faster with industry-aligned programs designed for real-world
            hiring. Our courses focus on hands-on projects, practical experience,
            and job-ready outcomes so your team or students are deployment-ready.
          </p>

          <Link to="/courses" className="moto-btn">
            Explore Courses 🚀
          </Link>
        </div>
      </div>
    </section>
  );
}
