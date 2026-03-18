import React from "react";
import "../../assets/css/policy.css";

export default function Terms() {
  return (
    <div className="policy-container">
      <div className="policy-content">

        <h1 className="policy-title">Terms & Conditions</h1>
        <p className="policy-date">Last Updated: March 2026</p>

        <div className="policy-section">
          <h3>1. Nature of Service</h3>
          <p>
            Aventra provides online educational courses including videos,
            materials, and assignments.
          </p>
        </div>

        <div className="policy-section">
          <h3>2. Course Access</h3>
          <ul>
            <li>Lifetime access</li>
            <li>Non-transferable</li>
          </ul>
        </div>

        <div className="policy-section">
          <h3>3. Intellectual Property</h3>
          <p>
            All content is owned by Aventra. Redistribution is strictly prohibited.
          </p>
        </div>

        <div className="policy-section">
          <h3>4. Payment Terms</h3>
          <p>Payments must be completed via authorized gateways.</p>
        </div>

        <div className="policy-section">
          <h3>5. Governing Law</h3>
          <p>These terms are governed by Indian law.</p>
        </div>

      </div>
    </div>
  );
}