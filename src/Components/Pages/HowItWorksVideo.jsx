import React from 'react';

export default function HowItWorksVideo() {
    return (
        <div className="container-xxl py-5">
            <div className="container">
                {/* Section Header */}
                <div className="text-center wow fadeInUp" data-wow-delay="0.1s" style={{ marginBottom: "40px" }}>
                    <span 
                        style={{ 
                            display: "inline-block", 
                            marginBottom: "16px", 
                            color: "#2563eb", 
                            fontWeight: "700", 
                            textTransform: "uppercase", 
                            letterSpacing: "1px",
                            padding: "6px 16px",
                            background: "rgba(37,99,235,0.1)",
                            borderRadius: "50px"
                        }}
                    >
                        Quick Guide
                    </span>
                    <h1 className="mb-4" style={{ fontSize: "clamp(2rem, 3vw, 2.5rem)", fontWeight: "800" }}>
                        How to Enroll & Start Learning
                    </h1>
                    <p style={{ color: "#64748b", maxWidth: "600px", margin: "0 auto", fontSize: "16px", lineHeight: "1.6" }}>
                        Watch this quick walkthrough to see how easy it is to start your journey, access your dashboard, and claim your guaranteed internship.
                    </p>
                </div>

                {/* Video Player Wrapper */}
                <div className="row justify-content-center">
                    <div className="col-lg-8 wow fadeInUp" data-wow-delay="0.3s">
                        <div style={{
                            position: "relative",
                            paddingBottom: "56.25%", /* Creates a perfect 16:9 Aspect Ratio */
                            height: 0,
                            overflow: "hidden",
                            borderRadius: "20px", /* Modern rounded corners */
                            boxShadow: "0 20px 40px rgba(0,0,0,0.15)", /* Deep soft shadow */
                            border: "1px solid rgba(0,0,0,0.08)",
                            background: "#000" /* Black background before video loads */
                        }}>
                            { <video 
                                controls 
                                poster="/img/thumbnail.jpg" // Optional: an image to show before they click play
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "" }}
                            >
                                <source src="/video/guide.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video> 
                            }

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}