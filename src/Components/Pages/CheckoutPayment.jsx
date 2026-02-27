import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../assets/css/checkout.css";
import axios from "axios";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

/* 🔑 Stripe TEST publishable key */
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

/* ================= Payment Form ================= */
function StripePaymentForm({ amount, courseId }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      // ✅ Simulated Stripe success (test mode)
      alert("✅ Payment Successful (Test Mode)");

      // 🔥 Call backend purchase route
      await axios.post(
        `http://localhost:3000/courses/purchase/${courseId}`,
        {},
        { withCredentials: true }
      );

      navigate("/dashboard");
    } catch (err) {
      console.error("Purchase error:", err);
      alert("Something went wrong while updating purchase.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <label>Card Details</label>

      <div className="card-box">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#020617",
                "::placeholder": { color: "#94a3b8" },
              },
            },
          }}
        />
      </div>

      <div className="checkout-price total">
        <span>Total Payable</span>
        <strong>₹{amount}</strong>
      </div>

      <button className="checkout-btn" type="submit">
        Pay ₹{amount}
      </button>

      <p style={{ marginTop: 14, fontSize: 13, opacity: 0.7 }}>
        Test mode • No real money will be charged
      </p>
    </form>
  );
}

/* ================= Page ================= */
export default function CheckoutPayment() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!location.state) {
    navigate("/checkout/details");
    return null;
  }

  const { pricing, courseId } = location.state;
  const amount = pricing?.finalPrice || 30000;

  return (
    <div className="checkout-wrapper">
      <div className="checkout-card">
        <h1 className="checkout-title">Payment</h1>
        <p className="checkout-subtitle">
          Secure checkout powered by Stripe
        </p>

        <div className="checkout-steps">
          <span>1 Details</span>
          <span>2 Referral</span>
          <span className="active">3 Payment</span>
        </div>

        <Elements stripe={stripePromise}>
          <StripePaymentForm amount={amount} courseId={courseId} />
        </Elements>
      </div>
    </div>
  );
}
