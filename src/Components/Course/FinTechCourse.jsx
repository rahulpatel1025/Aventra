import React from "react";
import "../../assets/css/fintech-course.css";
import { useNavigate } from "react-router-dom";

export default function FinTechCourse({ course }) {
  const navigate = useNavigate();

  if (!course) return null;

  // Fallback features if your course object doesn't have an array of them
  const features = course.features || [
    "Instant access to course materials",
    "Personalized learning dashboard",
    "Industry-recognized certificate",
    "Career placement assistance"
  ];

  return (
    <section className="fintech-section">
      <div className="modern-course-card">
        
        {/* ================= TOP SECTION (White) ================= */}
        <div className="card-top">
          <div className="card-header">
            {/* Light Blue Icon Box */}
            <div className="icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            
            {/* Pill Badge */}
            <div className="step-badge">
              {course.level ? course.level.toUpperCase() : "PREMIUM"}
            </div>
          </div>

          <h2 className="card-title">{course.title}</h2>
          <p className="card-description">{course.description}</p>
        </div>

        {/* ================= BOTTOM SECTION (Blue) ================= */}
        <div className="card-bottom">
          <h4 className="bottom-heading">WHAT YOU'LL GAIN:</h4>
          
          <ul className="feature-list">
            {features.map((feature, index) => (
              <li key={index}>
                <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
            <button
              className="action-btn solid-btn"
              onClick={() =>
                navigate("/checkout/details", {
                  state: {
                    courseId: course._id,
                    pricing: { finalPrice: course.price },
                  },
                })
              }
            >
              Enroll Now
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}