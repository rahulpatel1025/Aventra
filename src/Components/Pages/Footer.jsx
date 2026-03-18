import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <>
      {/* Removed bg-dark and text-light, relying on global light mode styles */}
      <div
        className="container-fluid footer pt-5 mt-5 wow fadeIn border-top"
        data-wow-delay="0.1s"
        style={{ backgroundColor: "#ffffff", borderTopColor: "rgba(0,0,0,0.08) !important" }}
      >
        <div className="container py-5">
          <div className="row g-5 justify-content-center">

            {/* ✅ Quick Links */}
            <div className="col-lg-4 col-md-6">
              <h4 className="mb-4" style={{ fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>Quick Links</h4>
              <Link className="btn btn-link footer-link" to="/privacy-policy">Privacy Policy </Link>
              <Link className="btn btn-link footer-link" to="/terms">Terms &amp; Condition</Link>
              <Link className="btn btn-link footer-link" to="/refund-policy">Refund policy</Link>
            </div>

            {/* ✅ Contact */}
            <div className="col-lg-4 col-md-6">
              <h4 className="mb-4" style={{ fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>Contact</h4>

              <p className="mb-3" style={{ color: "#475569" }}>
                <i className="fa fa-map-marker-alt me-3" style={{ color: "#0f172a" }} />
                Mumbai, Maharashtra, India
              </p>

              <p className="mb-3" style={{ color: "#475569" }}>
                <i className="fa fa-phone-alt me-3" style={{ color: "#0f172a" }} />
                +91 834-766-9000
              </p>

              <p className="mb-3" style={{ color: "#475569" }}>
                <i className="fa fa-envelope me-3" style={{ color: "#0f172a" }} />
                support@aventratechsolution.com
              </p>

              <div className="d-flex pt-3 gap-2">
                <a
                  className="btn btn-social minimal-social"
                  href="https://www.instagram.com/aventratechsolutions?igsh=MWZ1N211ZXR6Nmx2ZA%3D%3D"
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="fab fa-instagram" />
                </a>
                <a
                  className="btn btn-social minimal-social"
                  href="https://www.linkedin.com/in/basant-kumar-bharati"
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="fab fa-linkedin-in" />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ✅ Bottom Credit Section */}
        <div className="container border-top" style={{ borderColor: "rgba(0,0,0,0.08) !important" }}>
          <div className="copyright py-4">
            <div className="row align-items-center">

              {/* LEFT — Aventra */}
              <div className="col-md-6 text-center text-md-start mb-3 mb-md-0" style={{ color: "#64748b", fontSize: "14px" }}>
                © 2026 Aventra Tech Solutions. All Rights Reserved.
              </div>

              {/* RIGHT — Powered by + Logo */}
              <div className="col-md-6 text-center text-md-end footer-branding">
                <span className="powered-text" style={{ color: "#64748b", fontSize: "14px" }}>
                  Powered by{" "}
                  <a
                    href="https://patelbuilds.dev"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#0f172a", fontWeight: 600, textDecoration: "none" }}
                  >
                    patelbuilds.dev
                  </a>
                </span>

                {/* 🌗 Theme aware logos */}
                <img
                  src="/img/logo_dark.png"
                  alt="Rahul Logo Dark"
                  className="footer-logo logo-dark ms-2"
                  style={{ height: "24px" }}
                />

                <img
                  src="/img/logo.png"
                  alt="Rahul Logo Light"
                  className="footer-logo logo-light ms-2"
                  style={{ height: "24px", filter: "invert(1)" }} 
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}