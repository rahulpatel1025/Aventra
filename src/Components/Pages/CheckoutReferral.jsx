import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../assets/css/checkout.css";

// ── Referral codes ──
// AVENTRA1000  → ₹1000 off  (share with students)
// AVENTRADEV1  → pay ₹1     (your private testing code)
const REFERRAL_CODES = {
  "AVENTRA1000": { discount: null, label: "₹1,000 off" },   // discount set dynamically below
  "AVENTRADEV1": { discount: "almost_all", label: "Pay just ₹1 🎉" },
};

export default function CheckoutReferral() {
  const navigate = useNavigate();
  const location = useLocation();

  if (!location.state) {
    navigate("/checkout/details");
    return null;
  }

  const { user, course } = location.state;

  const [referralCode, setReferralCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedLabel, setAppliedLabel] = useState("");
  const [invalid, setInvalid] = useState(false);

  const basePrice = course.price || 30000;
  const finalPrice = Math.max(1, basePrice - discount); // never below ₹1

  const applyReferral = () => {
    const code = referralCode.trim().toUpperCase();
    setInvalid(false);
    setAppliedLabel("");

    if (code === "AVENTRADEV1") {
      setDiscount(basePrice - 1); // leaves exactly ₹1
      setAppliedLabel("Pay just ₹1 🎉");
    } else if (code === "AVENTRA1000") {
      setDiscount(1000);
      setAppliedLabel("₹1,000 off applied ✅");
    } else {
      setDiscount(0);
      setInvalid(true);
    }
  };

  const handleNext = () => {
    const validCourseId = course._id || course.id;

    if (!validCourseId) {
      alert("Course information is missing. Please go back and try again.");
      return;
    }

    navigate("/checkout/payment", {
      state: {
        courseId: validCourseId,
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

        <h2 className="checkout-title">Confirm &amp; Apply Referral</h2>
        <p className="checkout-subtitle">Review your fee details before payment</p>

        <div className="checkout-steps">
          <span>1 Details</span>
          <span className="active">2 Referral</span>
          <span>3 Payment</span>
        </div>

        <div className="summary-box">
          <h4>Course</h4>
          <p>{course.name || course.title || "Professional Course"}</p>
        </div>

        <div className="checkout-form">
          <label>Referral Code (optional)</label>
          <div className="referral-row">
            <input
              type="text"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value);
                setInvalid(false);
                setAppliedLabel("");
              }}
            />
            <button onClick={applyReferral}>Apply</button>
          </div>

          {/* Inline feedback — no alerts */}
          {appliedLabel && (
            <p style={{ color: "#16a34a", fontSize: 13, fontWeight: 600, marginTop: 6 }}>
              ✅ {appliedLabel}
            </p>
          )}
          {invalid && (
            <p style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>
              ❌ Invalid referral code
            </p>
          )}
        </div>

        <div className="price-box">
          <div>
            <span>Base Price</span>
            <span>₹{basePrice.toLocaleString()}</span>
          </div>
          <div>
            <span>Discount</span>
            <span style={{ color: discount > 0 ? "#16a34a" : undefined }}>
              - ₹{discount.toLocaleString()}
            </span>
          </div>
          <hr />
          <div className="total">
            <span>Total Payable</span>
            <span>₹{finalPrice.toLocaleString()}</span>
          </div>
        </div>

        <button className="checkout-btn" onClick={handleNext}>
          Proceed to Payment
        </button>

      </div>
    </section>
  );
}