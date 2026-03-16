import React, { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import "../../assets/css/checkout.css";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react"; 

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

/* 🔑 Stripe TEST publishable key */
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder" 
);

/* ================= Payment Form ================= */
function StripePaymentForm({ amount, courseId }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { getToken } = useAuth(); 
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      // 1️⃣ Generate a secure Payment Method ID from Stripe
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
      });

      if (error) {
        alert(error.message);
        setIsProcessing(false);
        return;
      }

      // 2️⃣ Get the secure Clerk Token
      const token = await getToken();

      // 3️⃣ Send the payload dynamically
      const response = await axios.post(
        "/api/payments/verify",
        {
          courseId: courseId, // 🔥 Dynamically fetching the course ID!
          amount: amount,
          paymentProvider: "stripe",
          paymentId: paymentMethod.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 4️⃣ Success! Redirect to the newly unlocked dashboard
      alert("✅ Payment Successful! Dashboard Unlocked.");
      navigate("/dashboard");

    } catch (err) {
      console.error("Purchase error:", err);
      alert(err.response?.data?.message || "Something went wrong while updating purchase.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <label>Card Details</label>

      <div className="card-box" style={{ padding: "12px", border: "1px solid #ccc", borderRadius: "6px", marginBottom: "20px", background: "#fff" }}>
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

      <button 
        className="checkout-btn" 
        type="submit" 
        disabled={!stripe || isProcessing}
        style={{ opacity: isProcessing ? 0.7 : 1 }}
      >
        {isProcessing ? "Processing..." : `Pay ₹${amount}`}
      </button>

      <p style={{ marginTop: 14, fontSize: 13, opacity: 0.7, textAlign: "center" }}>
        Test mode • No real money will be charged
      </p>
    </form>
  );
}

/* ================= Page ================= */
export default function CheckoutPayment() {
  const location = useLocation();

  // 🔥 STRICT CHECK: If the previous page forgot to pass the courseId, redirect to safety!
  if (!location.state || !location.state.courseId) {
    console.error("Missing courseId in state. Redirecting to courses.");
    return <Navigate to="/courses" replace />;
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