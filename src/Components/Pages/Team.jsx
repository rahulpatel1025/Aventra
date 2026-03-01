import React from "react";
import "../../assets/css/team-slider.css";

export default function Team() {
  return (
    <>
      <div className="container-xxl py-5">
        <div className="container">
          <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
            <h6 className="section-title bg-white text-center text-primary px-3">
              Trusted By
            </h6>
            <h1 className="mb-5 gradient-text">Our Clients</h1>
          </div>

          {/* 🔁 SLIDER WRAPPER */}
          <div className="clients-slider">
            <div className="clients-track">

              {/* -------- CARD 1 -------- */}
              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/client1.jpg" alt="Client" />
              </div>

              {/* -------- CARD 2 -------- */}
              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-2.jpg" alt="Client" />
              </div>

              {/* -------- CARD 3 -------- */}
              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-3.jpg" alt="Client" />
              </div>

              {/* -------- CARD 4 -------- */}
              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-4.jpg" alt="Client" />
              </div>

              {/* 🔁 DUPLICATE FOR SMOOTH LOOP (Must exactly match above) */}
              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/client1.jpg" alt="Client" />
              </div>

              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-2.jpg" alt="Client" />
              </div>

              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-3.jpg" alt="Client" />
              </div>

              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-4.jpg" alt="Client" />
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}