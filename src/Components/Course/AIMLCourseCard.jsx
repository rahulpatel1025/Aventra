import React from "react";
import "../../assets/css/fintech-course.css";

export default function AIMLCourseCard(){

  const features = [
    "Deep Learning & Neural Networks",
    "NLP & Computer Vision Models",
    "Model Deployment & MLOps",
    "Real-world AI Integration"
  ];

  return (
    <section className="fintech-section">
      <div className="modern-course-card">

        {/* TOP */}
        <div className="card-top">

          <div className="card-header">
            <div className="icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>

            <div className="step-badge">EXPERT</div>
          </div>

          <h2 className="card-title">
            AI & Machine Learning Engineering
          </h2>

          <p className="card-description">
            Master artificial intelligence and machine learning models
            for real-world enterprise applications.
          </p>

        </div>

        {/* BOTTOM */}
        <div className="card-bottom">

          <h4 className="bottom-heading">WHAT YOU'LL GAIN:</h4>

          <ul className="feature-list">
            {features.map((feature,i)=>(
              <li key={i}>
                <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <div className="price-container">
            <span className="price-amount">TBA</span>
            <span className="price-label">Coming Soon</span>
          </div>

          <div className="card-actions">
            <button className="action-btn outline-btn" disabled>
              Coming Soon
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}