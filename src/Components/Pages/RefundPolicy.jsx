import React from "react";
import "../../assets/css/policy.css";

export default function RefundPolicy() {
  return (
    <div className="policy-container">
      <div className="policy-content">

        <h1 className="policy-title">Refund Policy</h1>
        <p className="policy-date">Last Updated: March 2026</p>

        <div className="policy-section">
          <p>
            This Refund Policy outlines the terms regarding payments made to Aventra Tech Solution. By purchasing any course, users agree to this refund policy.
          </p>
        </div>

        <div className="policy-section">
          <h3>1. No Refund Policy</h3>
          <p>
            All course purchases made on Aventra Tech Solution are final and non-refundable. Once a course is purchased and access is granted:
          </p>
          <ul>
            <li>No refunds will be issued</li>
            <li>No cancellations will be accepted</li>
          </ul>
          <p>This applies to both:</p>
          <ul>
            <li>Full payment purchases</li>
            <li>EMI payment plans</li>
          </ul>
        </div>

        <div className="policy-section">
          <h3>2. Digital Product Policy</h3>
          <p>
            Our courses consist of digital educational content with instant access. Due to the nature of digital products, refunds cannot be provided once access has been granted.
          </p>
        </div>

        <div className="policy-section">
          <h3>3. EMI Payment Obligations</h3>
          <p>If a user purchases a course through an EMI plan:</p>
          <ul>
            <li>The user is legally obligated to complete all EMI payments.</li>
            <li>EMI payments cannot be cancelled once initiated.</li>
          </ul>
          <p>Failure to complete EMI payments may result in:</p>
          <ul>
            <li>Suspension of course access</li>
            <li>Payment recovery actions</li>
          </ul>
        </div>

        <div className="policy-section">
          <h3>4. Payment Disputes</h3>
          <p>
            Initiating a chargeback or payment dispute without valid reason may result in:
          </p>
          <ul>
            <li>Permanent suspension of the account</li>
            <li>Legal recovery of course fees</li>
          </ul>
        </div>

        <div className="policy-section">
          <h3>5. Exceptional Cases</h3>
          <p>Refunds may only be considered under rare circumstances such as:</p>
          <ul>
            <li>Duplicate payment</li>
            <li>Technical billing errors</li>
          </ul>
          <p>Such requests must be submitted within 7 days of payment.</p>
        </div>

        <div className="policy-section">
          <h3>6. Contact for Billing Issues</h3>
          <p>For payment-related queries contact:</p>
          <p>Email: <a href="mailto:support@aventratechsolution.com">support@aventratechsolution.com</a></p>
        </div>

      </div>
    </div>
  );
}