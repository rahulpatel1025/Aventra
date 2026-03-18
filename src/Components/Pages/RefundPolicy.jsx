import React from "react";
import "../../assets/css/policy.css";

export default function RefundPolicy() {
  return (
    <div className="policy-container">
      <div className="policy-content">

        <h1 className="policy-title">Refund Policy</h1>
        <p className="policy-date">Last Updated: March 2026</p>

        <div className="policy-section">
          <h3>1. No Refund Policy</h3>
          <p>
            All purchases are final. No refunds or cancellations once access is granted.
          </p>
        </div>

        <div className="policy-section">
          <h3>2. Digital Product Policy</h3>
          <p>
            Since courses are digital, refunds are not applicable after access.
          </p>
        </div>

        <div className="policy-section">
          <h3>3. EMI Obligations</h3>
          <p>
            EMI payments must be completed. Failure may result in suspension.
          </p>
        </div>

        <div className="policy-section">
          <h3>4. Exceptions</h3>
          <p>
            Refunds only for duplicate payments or billing errors within 7 days.
          </p>
        </div>

        <div className="policy-section">
          <h3>5. Contact</h3>
          <p>Email: support@aventratechsolution.com</p>
        </div>

      </div>
    </div>
  );
}