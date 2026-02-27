import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/checkout.css";

export default function CheckoutDetails() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    instituteEmail: "",
    personalEmail: "",
    phone: "",
    countryCode: "+91",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (!formData.fullName || !formData.personalEmail || !formData.phone) {
      alert("Please fill required fields");
      return;
    }

    navigate("/checkout/referral", {
      state: {
        user: formData,
        course: {
          name: "FinTech Systems & Digital Platforms",
          price: 30000,
        },
      },
    });
  };

  return (
    <section className="checkout-wrapper">
      <div className="checkout-card">

        {/* Header */}
        <h2 className="checkout-title">Apply for FinTech Program</h2>
        <p className="checkout-subtitle">
          Start your journey with industry-aligned delivery programs
        </p>

        {/* Step Indicator */}
        <div className="checkout-steps">
          <span className="active">1 Details</span>
          <span>2 Referral</span>
          <span>3 Payment</span>
        </div>

        {/* Form */}
        <div className="checkout-form">

          <div>
            <label>Full Name *</label>
            <input
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="checkout-grid">
            <div>
              <label>Institute Email (optional)</label>
              <input
                type="email"
                name="instituteEmail"
                placeholder="you@college.edu"
                value={formData.instituteEmail}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Personal Email *</label>
              <input
                type="email"
                name="personalEmail"
                placeholder="you@gmail.com"
                value={formData.personalEmail}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label>Phone Number *</label>
            <div className="phone-row">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
              >
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
              </select>

              <input
                type="tel"
                name="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="checkout-divider" />

          {/* CTA */}
          <button className="checkout-btn" onClick={handleNext}>
            Next
          </button>

        </div>
      </div>
    </section>
  );
}
