import React from "react";
import "../../assets/css/course-details.css";

export default function FintechCourseDetails() {
  return (
    <div className="course-detail-page course-details-wrapper">

      <div className="course-details-container">

        <h1 className="course-title">
          FinTech Skill Program with Paid Internship Pathway
        </h1>

        <p className="course-tagline">
          Build the Skills That Power Modern Finance
        </p>

        {/* INTRO */}
        <section>
          <p>
            Finance today is no longer driven by paperwork or traditional
            banking systems. It runs on APIs, digital payments, automation,
            compliance systems, and real-time analytics.
          </p>

          <p>
            Aventra Tech Solution’s FinTech Program bridges the gap between
            academic learning and real-world financial technology careers.
          </p>
        </section>

        {/* PROBLEM */}
        <section>
          <h2>❗ The Problem in Today’s Market</h2>
          <ul>
            <li>Colleges teach theory, not industry tools</li>
            <li>No hands-on exposure to real FinTech platforms</li>
            <li>Lack of experience with payment systems & compliance</li>
            <li>Companies don’t want to train freshers from scratch</li>
          </ul>
        </section>

        {/* IMPORTANCE */}
        <section>
          <h2>💡 Why FinTech Is Important Today</h2>
          <ul>
            <li>UPI, digital wallets & online banking</li>
            <li>Stock trading platforms & robo-advisors</li>
            <li>Loan automation & credit scoring</li>
            <li>Blockchain & digital assets</li>
            <li>Fraud detection & cybersecurity</li>
          </ul>
        </section>

        {/* COURSE STRUCTURE */}
        <section>
          <h2>📚 What This Course Covers</h2>
          <ul>
            <li>Digital finance ecosystems</li>
            <li>Modern banking systems</li>
            <li>Financial automation & compliance</li>
            <li>Secure financial data processing</li>
            <li>Technology-driven financial scaling</li>
          </ul>

          <p>
            The program is self-paced with multiple pre-recorded modules and
            real-world workflow simulations.
          </p>
        </section>

        {/* INTERNSHIP */}
        <section>
          <h2>🧪 Assessment & Internship Opportunity</h2>

          <p>Students must complete a final assessment.</p>

          <p>
            Scoring <strong>75% or above</strong> makes you eligible for:
          </p>

          <div className="internship-box">
            💼 100% Stipend-Based Internship with Aventra Tech Solution
          </div>

          <ul>
            <li>Paid stipend</li>
            <li>Real project exposure</li>
            <li>Resume & LinkedIn value</li>
          </ul>
        </section>

        {/* CERTIFICATION */}
        <section>
          <h2>🏆 Certification & Career Value</h2>

          <p>
            After successful completion, students receive an official FinTech
            Program Certification.
          </p>

          <ul>
            <li>FinTech startups</li>
            <li>Banks & NBFCs</li>
            <li>Financial software companies</li>
            <li>Consulting & analytics firms</li>
          </ul>
        </section>

      </div>
    </div>
  );
}