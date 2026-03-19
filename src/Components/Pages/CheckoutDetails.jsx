import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import "../../assets/css/checkout.css";

export default function CheckoutDetails() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  const { openSignIn } = useClerk();
  const { getToken } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    instituteEmail: "",
    personalEmail: "",
    phone: "",
    countryCode: "+91",
  });

  // Pre-fill from Clerk user once loaded
  React.useEffect(() => {
    if (isSignedIn && user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || "",
        personalEmail:
          prev.personalEmail ||
          user.primaryEmailAddress?.emailAddress ||
          "",
      }));
    }
  }, [isSignedIn, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    // ── Auth gate: must be signed in before proceeding ──
    if (!isSignedIn) {
      openSignIn({ redirectUrl: window.location.href });
      return;
    }

    if (!formData.fullName || !formData.personalEmail || !formData.phone) {
      alert("Please fill all required fields");
      return;
    }

    // ── Patch real name/email into DB (fixes Apple Hide My Email users) ──
    try {
      const token = await getToken();
      await axios.post(
        "/api/user/sync",
        {
          clerkId: user.id,
          fullName: formData.fullName,
          email: formData.personalEmail,
          profileImage: user.imageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Profile update failed (non-critical):", err);
      // Don't block checkout for this
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

  // Show nothing until Clerk has resolved auth state
  if (!isLoaded) {
    return (
      <section className="checkout-wrapper">
        <div className="checkout-card" style={{ textAlign: "center", padding: "60px 40px" }}>
          <p style={{ color: "#475569" }}>Loading...</p>
        </div>
      </section>
    );
  }

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

        {/* Auth Banner — shown only when not signed in */}
        {!isSignedIn && (
          <div
            style={{
              background: "#fef9c3",
              border: "1px solid #fde047",
              borderRadius: "8px",
              padding: "14px 18px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", color: "#713f12" }}>
              🔒 You need to be signed in to complete your purchase and receive your invoice.
            </p>
            <button
              onClick={() => openSignIn({ redirectUrl: window.location.href })}
              style={{
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Sign In / Sign Up
            </button>
          </div>
        )}

        {/* Signed in confirmation — shows personal email from form if filled,
            otherwise falls back to Clerk email (handles Apple relay case) */}
        {isSignedIn && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "8px",
              padding: "10px 16px",
              marginBottom: "24px",
              fontSize: "13px",
              color: "#166534",
            }}
          >
            ✅ Signed in as{" "}
            <strong>
              {formData.personalEmail || user.primaryEmailAddress?.emailAddress}
            </strong>{" "}
            — invoice will be sent to your personal email after payment.
          </div>
        )}

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

          <button className="checkout-btn" onClick={handleNext}>
            {isSignedIn ? "Next →" : "Sign In to Continue"}
          </button>

        </div>
      </div>
    </section>
  );
}