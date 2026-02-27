import React from "react";

export default function Footer() {
  return (
    <>
      <div
        className="container-fluid bg-dark text-light footer pt-5 mt-5 wow fadeIn"
        data-wow-delay="0.1s"
      >
        <div className="container py-5">
          <div className="row g-5 justify-content-center">

            {/* ✅ Quick Links */}
            <div className="col-lg-4 col-md-6">
              <h4 className="text-white mb-3">Quick Link</h4>

              <a className="btn btn-link" href="#">About Us</a>
              <a className="btn btn-link" href="#">Contact Us</a>
              <a className="btn btn-link" href="#">Privacy Policy</a>
              <a className="btn btn-link" href="#">Terms &amp; Condition</a>
              <a className="btn btn-link" href="#">Refund policy</a>
            </div>

            {/* ✅ Contact */}
            <div className="col-lg-4 col-md-6">
              <h4 className="text-white mb-3">Contact</h4>

              <p className="mb-2">
                <i className="fa fa-map-marker-alt me-3" />
                Mumbai, Maharashtra, India
              </p>

              <p className="mb-2">
                <i className="fa fa-phone-alt me-3" />
                +091 834-766-9000
              </p>

              <p className="mb-2">
                <i className="fa fa-envelope me-3" />
                aventratech1@gmail.com
              </p>

              <div className="d-flex pt-2">
                <a
    className="btn btn-outline-light btn-social"
    href="https://www.instagram.com/o_orahul_p/"
    target="_blank"
    rel="noreferrer"
  >
    <i className="fab fa-instagram" />
  </a>
                <a
                  className="btn btn-outline-light btn-social"
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
        <div className="container">
          <div className="copyright">
            <div className="row align-items-center">

              {/* LEFT — Aventra */}
              <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
                © 2026 Aventra Tech Solutions. All Rights Reserved.
              </div>

              {/* RIGHT — Powered by + Logo */}
              <div className="col-md-6 text-center text-md-end footer-branding">
                <span className="powered-text">
                  Powered by{" "}
                  <a
                    href="https://patelbuilds.dev"
                    target="_blank"
                    rel="noreferrer"
                  >
                    patelbuilds.dev
                  </a>
                </span>

                {/* 🌗 Theme aware logos */}
                <img
                  src="/img/logo_dark.png"
                  alt="Rahul Logo Dark"
                  className="footer-logo logo-dark"
                />

                <img
                  src="/img/logo.png"
                  alt="Rahul Logo Light"
                  className="footer-logo logo-light"
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
