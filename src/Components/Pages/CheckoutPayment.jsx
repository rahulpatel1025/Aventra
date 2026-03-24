import React, { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import "../../assets/css/checkout.css";

const EMI_BANKS = [
  { name: "BOB",   label: "Bank of Baroda" },
  { name: "AXIS",  label: "Axis Bank" },
  { name: "KOTAK", label: "Kotak Bank" },
  { name: "HDFC",  label: "HDFC Bank" },
  { name: "ICICI", label: "ICICI Bank" },
];

export default function CheckoutPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [emiActive, setEmiActive] = useState(false);

  if (!location.state || !location.state.courseId) {
    return <Navigate to="/courses" replace />;
  }

  const { pricing, courseId } = location.state;
  const amount = pricing?.finalPrice || 30000;
  const showEmi = amount >= 3000;
  const isFullFintechPrice = amount === 30000;

  // ── Referral code carried forward from CheckoutReferral ──
  const referralCode = pricing?.referralCode || null;

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const token = await getToken();

      const orderRes = await axios.post(
        "/api/payments/create-order",
        { amount, courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, keyId, emiActive: backendEmiActive } = orderRes.data;
      setEmiActive(!!backendEmiActive);

      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
          document.body.appendChild(script);
        });
      }

      const options = {
        key: keyId,
        amount: amount * 100,
        currency: "INR",
        name: "Aventra Tech Solutions",
        description: "Course Enrollment",
        image: "https://aventratechsolution.com/img/aventra-logo.png",
        order_id: orderId,

        prefill: {
          name: user?.fullName || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
          contact: "",
        },

        theme: { color: "#0f172a" },

        ...(showEmi && {
          config: {
            display: {
              blocks: {
                emi: {
                  name: backendEmiActive
                    ? "No Cost EMI — ₹5,000 × 6 months (BOB, Axis, Kotak, HDFC, ICICI)"
                    : "Pay in Easy Installments (EMI)",
                  instruments: [{ method: "emi" }],
                },
                other: {
                  name: "Other Payment Methods",
                  instruments: [
                    { method: "upi" },
                    { method: "card" },
                    { method: "netbanking" },
                    { method: "wallet" },
                  ],
                },
              },
              sequence: ["block.emi", "block.other"],
              preferences: { show_default_blocks: false },
            },
          },
        }),

        handler: async (response) => {
          try {
            const freshToken = await getToken();
            if (!freshToken) throw new Error("Session expired. Please log in again.");

            const verifyRes = await axios.post(
              "/api/payments/verify",
              {
                courseId,
                amount,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                // ── Pass referral code so it gets saved in MongoDB ──
                referralCode: referralCode || undefined,
              },
              { headers: { Authorization: `Bearer ${freshToken}` } }
            );

            if (verifyRes.status === 201) {
              navigate("/dashboard", { state: { enrolled: true }, replace: true });
            }
          } catch (verifyErr) {
            const msg = verifyErr.response?.data?.message || verifyErr.message || "Verification failed";
            if (verifyErr.response?.status === 409) {
              alert("ℹ️ You have already purchased this course.");
              navigate("/dashboard", { replace: true });
            } else {
              alert(`❌ ${msg}\n\nPayment ID: ${response.razorpay_payment_id}\nPlease contact support@aventratechsolution.com with this ID.`);
            }
          } finally {
            setIsProcessing(false);
          }
        },

        modal: { ondismiss: () => setIsProcessing(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        alert(`❌ Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });
      rzp.open();

    } catch (err) {
      alert(err.response?.data?.message || "Could not initiate payment. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-card">
        <h1 className="checkout-title">Payment</h1>
        <p className="checkout-subtitle">Secure checkout powered by Razorpay</p>

        <div className="checkout-steps">
          <span>1 Details</span>
          <span>2 Referral</span>
          <span className="active">3 Payment</span>
        </div>

        {/* Order summary */}
        <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:"8px", padding:"20px 24px", marginBottom:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px", fontSize:"14px", color:"#475569" }}>
            <span>Base Price</span>
            <span>₹{(pricing?.basePrice || amount).toLocaleString()}</span>
          </div>
          {pricing?.discount > 0 && (
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px", fontSize:"14px", color:"#16a34a" }}>
              <span>Referral Discount</span>
              <span>- ₹{pricing.discount.toLocaleString()}</span>
            </div>
          )}
          {referralCode && (
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px", fontSize:"13px", color:"#2563eb" }}>
              <span>Referral Code</span>
              <span style={{ fontWeight:700 }}>{referralCode}</span>
            </div>
          )}
          <hr style={{ border:"none", borderTop:"1px solid #e2e8f0", margin:"12px 0" }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:"17px", color:"#0f172a" }}>
            <span>Total Payable</span>
            <strong>₹{amount.toLocaleString()}</strong>
          </div>
        </div>

        {/* MINI10 benefit callout */}
        {referralCode === "MINI10" && (
          <div style={{ background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"1px solid #bfdbfe", borderRadius:"10px", padding:"16px 18px", marginBottom:"12px" }}>
            <div style={{ fontWeight:700, fontSize:"14px", color:"#1d4ed8", marginBottom:"6px" }}>🎯 MINI10 — Internship Support Activated</div>
            <div style={{ fontSize:"13px", color:"#1e3a8a", lineHeight:1.5 }}>
              You'll receive a dedicated benefits email after payment with everything that's unlocked for you.
            </div>
          </div>
        )}

        {/* No Cost EMI banner */}
        {isFullFintechPrice && (
          <div style={{ background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1px solid #86efac", borderRadius:"10px", padding:"16px 18px", marginBottom:"12px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"12px" }}>
              <span style={{ fontSize:"22px", flexShrink:0 }}>🎉</span>
              <div>
                <div style={{ fontWeight:700, fontSize:"14px", color:"#15803d", marginBottom:"6px" }}>No Cost EMI — ₹5,000 × 6 months</div>
                <div style={{ fontSize:"13px", color:"#166534", lineHeight:1.5, marginBottom:"10px" }}>
                  Zero interest, zero extra charges. Select EMI in the next step and choose the 6-month plan.
                </div>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {EMI_BANKS.map((bank) => (
                    <span key={bank.name} style={{ background:"#ffffff", border:"1px solid #86efac", borderRadius:"99px", padding:"3px 10px", fontSize:"11px", fontWeight:600, color:"#15803d" }}>
                      {bank.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regular EMI */}
        {showEmi && !isFullFintechPrice && (
          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:"8px", padding:"14px 18px", marginBottom:"12px", fontSize:"13px", color:"#1d4ed8", display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ fontSize:"18px" }}>💳</span>
            <div><strong>EMI available</strong> — Pay in easy monthly installments. EMI options will appear in the next step.</div>
          </div>
        )}

        {/* Post payment info */}
        <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:"8px", padding:"14px 18px", marginBottom:"24px", fontSize:"13px", color:"#166534" }}>
          ✅ After payment, you'll receive an invoice + welcome email and be redirected to your dashboard instantly.
        </div>

        <button
          className="checkout-btn"
          onClick={handlePayment}
          disabled={isProcessing}
          style={{ opacity: isProcessing ? 0.7 : 1 }}
        >
          {isProcessing
            ? "Processing..."
            : isFullFintechPrice
            ? "Pay ₹30,000 · or No Cost EMI ₹5,000×6"
            : `Pay ₹${amount.toLocaleString()} with Razorpay`}
        </button>

        <p style={{ marginTop:14, fontSize:13, opacity:0.7, textAlign:"center" }}>
          🔒 Secured by Razorpay · UPI · Cards · Netbanking · No Cost EMI
        </p>
      </div>
    </div>
  );
}