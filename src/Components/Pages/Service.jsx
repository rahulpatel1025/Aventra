import React from "react";
import "../../assets/css/service.css";

export default function Service() {
  const services = [
    {
      icon: "fa-graduation-cap",
      title: "SaaS Application Development & Enhancements",
    },
    {
      icon: "fa-globe",
      title: "FinTech Systems & Digital Financial Platforms",
    },
    {
      icon: "fa-home",
      title: "Web & Mobile Application Development",
    },
    {
      icon: "fa-book-open",
      title: "Backend Systems, APIs & Integrations",
    },
    {
      icon: "fa-cloud",
      title: "Cloud Deployment & DevOps Support",
    },
    {
      icon: "fa-shield-alt",
      title: "QA, Testing & Release Readiness",
    },
    {
      icon: "fa-tools",   // ✅ NEW
      title: "Ongoing Maintenance & Technical Support", // ✅ NEW
    },
  ];

  return (
    <section className="service-section">
      <div className="service-container">
        {services.map((service, index) => (
          <div className="service-card" key={index}>
            <i className={`fa fa-3x ${service.icon}`} />
            <h5>{service.title}</h5>
          </div>
        ))}

        {/* ✅ Info Text Panel */}
        <div className="service-info">
          <p>
            We seamlessly integrate with your internal teams and follow your
            delivery standards, timelines, and documentation practices.
          </p>
        </div>
      </div>
    </section>
  );
}
