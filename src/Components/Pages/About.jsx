import React from "react";

export default function About() {
  return (
    <>
      <div className="container-xxl py-5">
        <div className="container">
          <div className="row g-5">
            <div
              className="col-lg-6 wow fadeInUp"
              data-wow-delay="0.1s"
              style={{ minHeight: "400px" }}
            >
              <div className="position-relative h-100">
                <img
                  className="img-fluid position-absolute w-100 h-100"
                  src="/img/about.jpg"
                  alt="about jpg"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
            <div className="col-lg-6 wow fadeInUp" data-wow-delay="0.3s">
              <h6 className="section-title bg-white text-start text-primary pe-3">
                About Us
              </h6>
              <h1 className="mb-4 gradient-text">Aventra Tech Solution
</h1>
              <p className="mb-4">
               Aventra Tech Solution is a specialized project delivery and execution partner for IT, SaaS, and technology consulting companies. We work strictly as a backend delivery arm—helping tech firms build, execute, and deliver projects to their end clients with precision, speed, and confidentiality.

We do not compete with our partners. We strengthen them.
 {" "}
              </p>
              <p className="mb-4">
                Join our community of lifelong learners and discover the endless
                opportunities for growth and development.
              </p>
              <div className="row gy-2 gx-4 mb-4">
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2" />
                    Ready-to-deploy delivery teams
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2" />
                    Delivery-focused execution model
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2" />
                    Strict NDA & confidentiality
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2" />
                    Scalable delivery capacity
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2" />
                    Strong FinTech & SaaS exposure
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2" />
                    Quality-controlled outputs
                  </p>
                </div>
              </div>
              {/* <a className="btn btn-primary py-3 px-5 mt-2" href>Read More</a> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
