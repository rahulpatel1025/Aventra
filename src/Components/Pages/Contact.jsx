import React, { useState } from "react";

export default function Contact() {
  // Enhanced state to handle UI feedback better
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "info", message: "Sending your message..." });
    
    const formData = new FormData(event.target);

    // Web3Forms access key
    formData.append("access_key", "b9fd69e0-c307-4f57-b90f-9c4106746fcb");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ 
          type: "success", 
          message: "Thank you! Your message has been sent successfully." 
        });
        event.target.reset(); // Clear the form fields
      } else {
        console.log("Error", data);
        setStatus({ 
          type: "danger", 
          message: data.message || "An error occurred while sending your message." 
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setStatus({ 
        type: "danger", 
        message: "Network error. Please check your connection and try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="container-xxl py-5">
        <div className="container">
          <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
            <h6 className="section-title bg-white text-center text-primary px-3">
              Contact Us
            </h6>
            <h1 className="mb-5">Contact For Any Query</h1>
          </div>
          
          <div className="row g-4 justify-content-center">
            
            {/* Contact Information Section */}
            <div
              className="col-lg-5 col-md-6 wow fadeInUp"
              data-wow-delay="0.1s"
            >
              <h5>Get In Touch</h5>
              <p className="mb-4">
                Have any questions? Please contact us via phone, email, or use the contact form to reach out directly.
              </p>
              
              <div className="d-flex align-items-center mb-3">
                <div
                  className="d-flex align-items-center justify-content-center flex-shrink-0 bg-primary"
                  style={{ width: "50px", height: "50px" }}
                >
                  <i className="fa fa-map-marker-alt text-white" />
                </div>
                <div className="ms-3">
                  <h5 className="text-primary">Office</h5>
                  <p className="mb-0">Mumbai, Maharashtra</p>
                </div>
              </div>
              
              <div className="d-flex align-items-center mb-3">
                <div
                  className="d-flex align-items-center justify-content-center flex-shrink-0 bg-primary"
                  style={{ width: "50px", height: "50px" }}
                >
                  <i className="fa fa-phone-alt text-white" />
                </div>
                <div className="ms-3">
                  <h5 className="text-primary">Mobile</h5>
                  <p className="mb-0">+91 834 766 9000</p>
                </div>
              </div>
              
              <div className="d-flex align-items-center">
                <div
                  className="d-flex align-items-center justify-content-center flex-shrink-0 bg-primary"
                  style={{ width: "50px", height: "50px" }}
                >
                  <i className="fa fa-envelope-open text-white" />
                </div>
                <div className="ms-3">
                  <h5 className="text-primary">Email</h5>
                  <p className="mb-0">support@aventratechsolution.com</p>
                </div>
              </div>
            </div>

            {/* Contact Form Section */}
            <div
              className="col-lg-7 col-md-12 wow fadeInUp"
              data-wow-delay="0.5s"
            >
              <form onSubmit={onSubmit}>
                <input type="hidden" name="from_name" value="eLearning" />
                <input type="hidden" name="subject" value="New Submission from contact page" />

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        id="name"
                        placeholder="Your Name"
                        required
                        disabled={isSubmitting}
                      />
                      <label htmlFor="name">Your Name</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        placeholder="Your Email"
                        required
                        disabled={isSubmitting}
                      />
                      <label htmlFor="email">Your Email</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-floating">
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        placeholder="Mobile No"
                        required
                        disabled={isSubmitting}
                      />
                      <label htmlFor="phone">Mobile No</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-floating">
                      <textarea
                        className="form-control"
                        placeholder="Leave a message here"
                        id="message"
                        name="message"
                        style={{ height: "150px" }}
                        required
                        disabled={isSubmitting}
                      />
                      <label htmlFor="message">Message</label>
                    </div>
                  </div>
                  
                  {/* Status Message Alert */}
                  {status.message && (
                    <div className="col-12">
                      <div className={`alert alert-${status.type} m-0`} role="alert">
                        {status.message}
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <button
                      className="btn btn-primary w-100 py-3"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}