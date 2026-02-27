import React from "react";
import "../../assets/css/fintech-course.css";
import { useNavigate } from "react-router-dom";

export default function FinTechCourse({ course }) {
  const navigate = useNavigate();

  if (!course) return null;

  return (
    <section className="fintech-section">
      <div className="fintech-card">

        {/* Badge */}
        <div className="fintech-badge">
          {course.level?.toUpperCase()} Program
        </div>

        {/* Title */}
        <h2 className="fintech-title">
          {course.title}
        </h2>

        {/* Subtitle */}
        <p className="fintech-subtitle">
          {course.description}
        </p>

        {/* Price */}
        <div className="fintech-price">
          ₹{course.price.toLocaleString()} <span>Full Program</span>
        </div>

        {/* CTA */}
        <div className="fintech-actions">
          
          {/* View Details */}
          <button
            className="fintech-btn primary"
            onClick={() => navigate(`/courses/${course.slug}`)}
          >
            View Program Details
          </button>

          {/* Enroll */}
          <button
            className="fintech-btn secondary"
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
    </section>
  );
}
