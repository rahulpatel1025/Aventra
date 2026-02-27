import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../assets/css/checkout.css";

export default function CheckoutReferral() {
  const navigate = useNavigate();
  const location = useLocation();

  // Safety check (direct URL access protection)
  if (!location.state) {
    navigate("/checkout/details");
    return null;
  }

  const { user, course } = location.state;

  const [referralCode, setReferralCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const basePrice = course.price;
  const finalPrice = basePrice - discount;

  const applyReferral = () => {
    // Demo referral logic
    if (referralCode === "AVENTRA1000") {
      setDiscount(1000);
      alert("Referral applied: ₹1000 off");
    } else {
      setDiscount(0);
      alert("Invalid referral code");
    }
  };

  const handleNext = () => {
    navigate("/checkout/payment", {
      state: {
        user,
        course,
        pricing: {
          basePrice,
          discount,
          finalPrice,
        },
      },
    });
  };

  return (
    <section className="checkout-wrapper">
      <div className="checkout-card">

        {/* Header */}
        <h2 className="checkout-title">Confirm & Apply Referral</h2>
        <p className="checkout-subtitle">
          Review your fee details before payment
        </p>

        {/* Step Indicator */}
        <div className="checkout-steps">
          <span>1 Details</span>
          <span className="active">2 Referral</span>
          <span>3 Payment</span>
        </div>

        {/* Course Summary */}
        <div className="summary-box">
          <h4>Course</h4>
          <p>{course.name}</p>
        </div>

        {/* Referral */}
        <div className="checkout-form">
          <label>Referral Code (optional)</label>
          <div className="referral-row">
            <input
              type="text"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
            <button onClick={applyReferral}>Apply</button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="price-box">
          <div>
            <span>Base Price</span>
            <span>₹{basePrice}</span>
          </div>

          <div>
            <span>Discount</span>
            <span>- ₹{discount}</span>
          </div>

          <hr />

          <div className="total">
            <span>Total Payable</span>
            <span>₹{finalPrice}</span>
          </div>
        </div>

        {/* CTA */}
        <button className="checkout-btn" onClick={handleNext}>
          Proceed to Payment
        </button>

      </div>
    </section>
  );
}
