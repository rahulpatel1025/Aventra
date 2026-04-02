import React, { useState } from "react";
import axios from "axios";
import "../../assets/css/contact.css";

export default function Contact() {
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "info", message: "Sending your message..." });

    // Grab form data
    const formData = new FormData(event.target);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      message: formData.get("message"),
    };

    try {
      // Send to YOUR backend instead of Web3Forms
      const response = await axios.post("/api/contact/submit", payload);

      if (response.data.success) {
        setStatus({
          type: "success",
          message: "✅ Message sent! We'll get back to you within 24 hours.",
        });
        event.target.reset(); // Clear the form
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.error || "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Hero ── */}
      <div className="contact-hero">
        <div className="contact-hero-label">
          <span>✉️</span> Get In Touch
        </div>
        <h1>Contact For Any Query</h1>
        <p>
          Have a question about our courses, internship program, or partnerships?
          We typically respond within 24 hours.
        </p>
      </div>

      {/* ── Content ── */}
      <div className="contact-page">
        <div className="contact-inner">

          {/* ── LEFT — Info ── */}
          <div className="contact-info-col">
            <h2>Let's Talk</h2>
            <p>
              Reach out via the form or contact us directly through any of the
              channels below.
            </p>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <i className="fa fa-map-marker-alt" />
              </div>
              <div className="contact-info-text">
                <h5>Office</h5>
                <p>Mumbai, Maharashtra, India</p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <i className="fa fa-phone-alt" />
              </div>
              <div className="contact-info-text">
                <h5>Phone</h5>
                <p>+91 834 766 9000</p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <i className="fa fa-envelope" />
              </div>
              <div className="contact-info-text">
                <h5>Email</h5>
                <p>support@aventratechsolution.com</p>
              </div>
            </div>

            <div className="contact-socials">
              <a href="https://www.instagram.com/aventratechsolutions" target="_blank" rel="noreferrer" className="contact-social-btn" title="Instagram">
                <i className="fab fa-instagram" />
              </a>
              <a href="https://www.linkedin.com/in/basant-kumar-bharati" target="_blank" rel="noreferrer" className="contact-social-btn" title="LinkedIn">
                <i className="fab fa-linkedin-in" />
              </a>
            </div>
          </div>

          {/* ── RIGHT — Form ── */}
          <div className="contact-form-card">
            <div className="contact-form-title">Send Us a Message</div>
            <div className="contact-form-subtitle">
              All fields are required. We'll reply to your email within 24 hours.
            </div>

            <form onSubmit={onSubmit}>
              {/* Name + Email row */}
              <div className="contact-form-row">
                <div className="contact-form-group" style={{ marginBottom: 0 }}>
                  <label className="contact-form-label" htmlFor="name">Your Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="contact-form-input"
                    placeholder="Rahul Patel"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="contact-form-group" style={{ marginBottom: 0 }}>
                  <label className="contact-form-label" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="contact-form-input"
                    placeholder="you@example.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="contact-form-group">
                <label className="contact-form-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="contact-form-input"
                  placeholder="+91 98765 43210"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Message */}
              <div className="contact-form-group">
                <label className="contact-form-label" htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  className="contact-form-textarea"
                  placeholder="Tell us about your query — course details, internship, partnerships..."
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Status */}
              {status.message && (
                <div className={`contact-status ${status.type}`}>
                  {status.message}
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="contact-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="contact-spinner" /> Sending...
                  </>
                ) : (
                  <>
                    <i className="fa fa-paper-plane" /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}