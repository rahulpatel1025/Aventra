import React from "react";
import "../../assets/css/policy.css";

export default function PrivacyPolicy() {
  return (
    <div className="policy-container">
      <div className="policy-content">

        <h1 className="policy-title">Privacy Policy</h1>
        <p className="policy-date">Last Updated: March 2026</p>

        <div className="policy-section">
          <p>
            Welcome to Aventra Tech Solution. Your privacy is important to us.
            This policy explains how we collect, use, and protect your data.
          </p>
        </div>

        <div className="policy-section">
          <h3>1. Information We Collect</h3>

          <p><strong>Personal Information:</strong></p>
          <ul>
            <li>Full Name</li>
            <li>Email Address</li>
            <li>Phone Number</li>
            <li>Billing Address</li>
          </ul>

          <p><strong>Technical Information:</strong></p>
          <ul>
            <li>IP Address</li>
            <li>Browser & Device Info</li>
            <li>Pages visited</li>
          </ul>
        </div>

        <div className="policy-section">
          <h3>2. How We Use Your Information</h3>
          <ul>
            <li>Provide course access</li>
            <li>Process payments</li>
            <li>Improve platform</li>
            <li>Prevent fraud</li>
          </ul>
        </div>

        <div className="policy-section">
          <h3>3. Data Protection</h3>
          <p>
            We use SSL encryption, secure authentication, and limited access to protect data.
          </p>
        </div>

        <div className="policy-section">
          <h3>4. Contact</h3>
          <p>Email: support@aventratechsolution.com</p>
        </div>

      </div>
    </div>
  );
}