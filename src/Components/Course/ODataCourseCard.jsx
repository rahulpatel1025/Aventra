import React from "react";
import "../../assets/css/fintech-course.css";
import { useNavigate } from "react-router-dom";

export default function ODataCourseCard({ course }) {
  const navigate = useNavigate();

  if (!course) return null;

  const features = course.features?.length > 0
    ? course.features
    : [
        "Advanced RESTful API Design",
        "OData V4 Protocol Deep-Dive",
        "Secure Data Integration Workflows",
        "Real-world Backend Routing",
      ];

  return (
    <section className="fintech-section">
      <div className="modern-course-card">

        {/* TOP */}
        <div className="card-top">
          <div className="card-header">
            <div className="icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="step-badge">
              {course.level ? course.level.toUpperCase() : "ADVANCED"}
            </div>
          </div>

          <h2 className="card-title">{course.title}</h2>
          <p className="card-description">{course.description}</p>
        </div>

        {/* BOTTOM */}
        <div className="card-bottom">
          <h4 className="bottom-heading">WHAT YOU'LL GAIN:</h4>

          <ul className="feature-list">
            {features.map((feature, i) => (
              <li key={i}>
                <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <div className="price-container">
            <span className="price-amount">₹{course.price.toLocaleString()}</span>
            <span className="price-label">Full Program</span>
          </div>

          <div className="card-actions">
            <button
              className="action-btn outline-btn"
              onClick={() => navigate(`/courses/${course.slug}`)}
            >
              View Details
            </button>
            
            {/* --- ENROLL BUTTON COMMENTED OUT FOR NOW ---
            <button
              className="action-btn solid-btn"
              onClick={() =>
                navigate("/checkout/details", {
                  state: {
                    courseId: course._id,
                    courseName: course.title,
                    pricing: { finalPrice: course.price, basePrice: course.price },
                  },
                })
              }
            >
              Enroll Now
            </button> 
            ---------------------------------------------- */}
            
            {/* --- COMING SOON BADGE REPLACEMENT --- */}
            <button
              className="action-btn solid-btn"
              style={{ cursor: "not-allowed", opacity: 0.7, pointerEvents: "none" }}
              disabled
            >
              Coming Soon
            </button>

          </div>
        </div>

      </div>
    </section>
  );
}