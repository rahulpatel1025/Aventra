import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../assets/css/checkout.css";

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
  const [appliedCode, setAppliedCode] = useState(null); // store validated code
  const [invalid, setInvalid] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const basePrice = course.price || 30000;
  const finalPrice = Math.max(1, basePrice - discount);

  const applyReferral = async () => {
    const code = referralCode.trim();
    if (!code) return;

    setIsApplying(true);
    setInvalid(false);
    setAppliedLabel("");
    setAppliedCode(null);

    try {
      const res = await axios.post("/api/referral/validate", {
        code,
        coursePrice: basePrice,
      });

      if (res.data.valid) {
        setDiscount(res.data.discount);
        setAppliedLabel(res.data.label);
        setAppliedCode(code.toUpperCase()); // save for forwarding
      } else {
        setDiscount(0);
        setInvalid(true);
      }
    } catch (err) {
      setDiscount(0);
      setInvalid(true);
    } finally {
      setIsApplying(false);
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
          // ── Pass referral code forward so it gets stored in MongoDB ──
          referralCode: appliedCode || null,
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
                setAppliedCode(null);
                setDiscount(0);
              }}
              onKeyDown={(e) => e.key === "Enter" && applyReferral()}
            />
            <button onClick={applyReferral} disabled={isApplying}>
              {isApplying ? "..." : "Apply"}
            </button>
          </div>

          {appliedLabel && (
            <p style={{ color:"#16a34a", fontSize:13, fontWeight:600, marginTop:6 }}>
              ✅ {appliedLabel}
            </p>
          )}
          {invalid && (
            <p style={{ color:"#dc2626", fontSize:13, marginTop:6 }}>
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