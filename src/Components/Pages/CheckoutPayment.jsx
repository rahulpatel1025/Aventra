import React, { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import "../../assets/css/checkout.css";

export default function CheckoutPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!location.state || !location.state.courseId) {
    console.error("Missing courseId in state. Redirecting to courses.");
    return <Navigate to="/courses" replace />;
  }

  const { pricing, courseId } = location.state;
  const amount = pricing?.finalPrice || 30000;

  // ── EMI is only shown by Razorpay when amount >= 3000 ──
  // For ₹1 test payments (AVENTRADEV1 code) we skip the EMI block
  // so the modal doesn't look broken
  const showEmi = amount >= 3000;

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const token = await getToken();

      // ── STEP 1: Create Razorpay order ──
      const orderRes = await axios.post(
        "/api/payments/create-order",
        { amount, courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, keyId } = orderRes.data;

      // ── STEP 2: Load Razorpay SDK if not already loaded ──
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
          document.body.appendChild(script);
        });
      }

      // ── STEP 3: Build Razorpay options ──
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

        // ── EMI + payment method display config ──
        // Only applied when amount >= ₹3,000
        // Razorpay ignores config.display silently if EMI isn't available
        ...(showEmi && {
          config: {
            display: {
              blocks: {
                emi: {
                  name: "Pay in Easy Installments (EMI)",
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
              preferences: {
                show_default_blocks: false,
              },
            },
          },
        }),

        // ── STEP 4: On success, fetch fresh token and verify ──
        handler: async (response) => {
          console.log("✅ Razorpay success:", response);
          try {
            const freshToken = await getToken();

            if (!freshToken) {
              throw new Error("Session expired. Please log in again.");
            }

            const verifyRes = await axios.post(
              "/api/payments/verify",
              {
                courseId,
                amount,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${freshToken}` } }
            );

            console.log("✅ Verify response:", verifyRes.status, verifyRes.data);

            if (verifyRes.status === 201) {
              navigate("/dashboard", {
                state: { enrolled: true },
                replace: true,
              });
            }
          } catch (verifyErr) {
            console.error("❌ Verify error:", verifyErr.response?.data || verifyErr.message);
            const msg = verifyErr.response?.data?.message || verifyErr.message || "Verification failed";

            if (verifyErr.response?.status === 409) {
              alert("ℹ️ You have already purchased this course.");
              navigate("/dashboard", { replace: true });
            } else {
              alert(
                `❌ ${msg}\n\nPayment ID: ${response.razorpay_payment_id}\nPlease contact support@aventratechsolution.com with this ID.`
              );
            }
          } finally {
            setIsProcessing(false);
          }
        },

        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        alert(`❌ Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });

      rzp.open();

    } catch (err) {
      console.error("Payment initiation error:", err);
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
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "20px 24px",
          marginBottom: "24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px", color: "#475569" }}>
            <span>Base Price</span>
            <span>₹{pricing?.basePrice || amount}</span>
          </div>
          {pricing?.discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px", color: "#16a34a" }}>
              <span>Referral Discount</span>
              <span>- ₹{pricing.discount}</span>
            </div>
          )}
          <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "17px", color: "#0f172a" }}>
            <span>Total Payable</span>
            <strong>₹{amount}</strong>
          </div>
        </div>

        {/* EMI info banner — only shown when amount >= ₹3000 */}
        {showEmi && (
          <div style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#1d4ed8",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <span style={{ fontSize: "18px" }}>💳</span>
            <div>
              <strong>EMI available</strong> — Pay in easy monthly installments starting from ₹{Math.round(amount / 12).toLocaleString()}/month.
              EMI options will appear in the next step.
            </div>
          </div>
        )}

        {/* Post-payment info */}
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #86efac",
          borderRadius: "8px",
          padding: "14px 18px",
          marginBottom: "24px",
          fontSize: "13px",
          color: "#166534",
        }}>
          ✅ After payment, you'll receive an invoice + welcome email and be redirected to your dashboard instantly.
        </div>

        <button
          className="checkout-btn"
          onClick={handlePayment}
          disabled={isProcessing}
          style={{ opacity: isProcessing ? 0.7 : 1 }}
        >
          {isProcessing ? "Processing..." : `Pay ₹${amount.toLocaleString()} with Razorpay`}
        </button>

        <p style={{ marginTop: 14, fontSize: 13, opacity: 0.7, textAlign: "center" }}>
          🔒 Secured by Razorpay · UPI · Cards · Netbanking · EMI
        </p>
      </div>
    </div>
  );
}