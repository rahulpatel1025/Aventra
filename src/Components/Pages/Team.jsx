import React from "react";
import "../../assets/css/team-slider.css";   // 👈 create this file

export default function Team() {
  return (
    <>
      <div className="container-xxl py-5">
        <div className="container">
          <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
            <h6 className="section-title bg-white text-center text-primary px-3">
              Instructors
            </h6>
            <h1 className="mb-5 gradient-text">Our Clients</h1>
          </div>

          {/* 🔁 SLIDER WRAPPER */}
          <div className="clients-slider">
            <div className="clients-track">

              {/* -------- CARD 1 -------- */}
              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-1.jpg" alt="" />
                <div className="text-center p-3">
                  <h5>Mr. John Deo</h5>
                  <small>MERN Stack Developer</small>
                </div>
              </div>

              {/* -------- CARD 2 -------- */}
              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-2.jpg" alt="" />
                <div className="text-center p-3">
                  <h5>Mrs. Shradha</h5>
                  <small>Web Designer & Developer</small>
                </div>
              </div>

              {/* -------- CARD 3 -------- */}
              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-3.jpg" alt="" />
                <div className="text-center p-3">
                  <h5>Mr. Bobby Ficher</h5>
                  <small>Data Structure & Algorithms</small>
                </div>
              </div>

              {/* -------- CARD 4 -------- */}
              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-4.jpg" alt="" />
                <div className="text-center p-3">
                  <h5>Mrs. Manvi</h5>
                  <small>C and C++</small>
                </div>
              </div>

              {/* 🔁 DUPLICATE FOR SMOOTH LOOP */}
              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-1.jpg" alt="" />
                <div className="text-center p-3">
                  <h5>Mr. John Deo</h5>
                  <small>MERN Stack Developer</small>
                </div>
              </div>

              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-2.jpg" alt="" />
                <div className="text-center p-3">
                  <h5>Mrs. Shradha</h5>
                  <small>Web Designer & Developer</small>
                </div>
              </div>

              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-3.jpg" alt="" />
                <div className="text-center p-3">
                  <h5>Mr. Bobby Ficher</h5>
                  <small>Data Structure & Algorithms</small>
                </div>
              </div>

              <div className="team-item bg-light">
                <img className="img-fluid" src="/img/team-4.jpg" alt="" />
                <div className="text-center p-3">
                  <h5>Mrs. Manvi</h5>
                  <small>C and C++</small>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
