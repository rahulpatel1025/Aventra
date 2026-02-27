import React from "react";
import { Link } from "react-router-dom";
import "../../assets/css/dashboardCTA.css";

export default function DashboardCTA() {
  return (
    <section className="dashboard-cta">
      <div className="dashboard-cta-content">
        <h3>Already enrolled?</h3>

        <Link to="/dashboard" className="dashboard-btn">
          Login to Dashboard →
        </Link>
      </div>
    </section>
  );
}
