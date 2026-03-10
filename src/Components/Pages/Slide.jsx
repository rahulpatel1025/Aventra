import React from "react";
import "../../assets/css/Slide.css";
import { Link } from "react-router-dom";

export default function Slide() {
  return (
    <>
      <div
        id="carouselExampleControlsNoTouching"
        className="carousel slide"
        data-bs-touch="false"
      >
        <div className="carousel-inner">

          {/* ---------- SLIDE 1 ---------- */}
          <div className="carousel-item active">
            <div className="owl-carousel-item position-relative slide-bg parallax-bg" data-speed="0.25">
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                <div className="container text-center">
                  <div className="row justify-content-center">
                    <div className="col-sm-10 col-lg-8">

                      {/* Tagline Pill */}
                      <div className="hero-tagline scroll-zoom-in">
                        <span>✨</span> Turn your ideas into reality
                      </div>

                      {/* Title */}
                      <h1 className="display-4 hero-title scroll-fade-in">
                        Your Trusted Project Delivery Partner
                      </h1>

                      {/* Description */}
                      <p className="hero-description scroll-slide-up">
                        Aventra Tech Solution is a specialized project delivery and execution partner for IT, SaaS, and technology companies. We work strictly as a backend delivery arm.
                      </p>

                      {/* Actions */}
                      <div className="hero-actions justify-content-center scroll-slide-up">
                        <Link
                          to=""
                          className="bw-button bw-button-primary me-3"
                        >
                          Partner with us
                        </Link>

                        <Link
                          to="/courses"
                          className="bw-button bw-button-secondary"
                        >
                          View capabilities
                        </Link>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- SLIDE 2 ---------- */}
          <div className="carousel-item">
            <div className="owl-carousel-item position-relative slide-bg parallax-bg" data-speed="0.2">
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                <div className="container text-center">
                  <div className="row justify-content-center">
                    <div className="col-sm-10 col-lg-8">

                      {/* Tagline Pill */}
                      <div className="hero-tagline scroll-zoom-in">
                        <span>📚</span> Best Online Courses
                      </div>

                      <h1 className="display-4 hero-title scroll-slide-up">
                        Get Educated Online From Your Home
                      </h1>

                      <p className="hero-description scroll-slide-up">
                        Unlock a world of possibilities with Aventra. Enroll now to access our cutting-edge courses and elevate your learning experience!
                      </p>

                      <div className="hero-actions justify-content-center scroll-zoom-in">
                        <Link
                          to=""
                          className="bw-button bw-button-primary me-3"
                        >
                          Start Learning
                        </Link>

                        <Link
                          to="/courses"
                          className="bw-button bw-button-secondary"
                        >
                          Browse Courses
                        </Link>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Controls */}
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#carouselExampleControlsNoTouching"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>

        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#carouselExampleControlsNoTouching"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </>
  );
}