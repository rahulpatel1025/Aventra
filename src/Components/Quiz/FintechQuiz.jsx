import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/quiz.css";

const COURSE_ID = "698dee27e56d0404b2ec951c";

const questions = [
  {
    question: "Challenger Banks Differentiation: Which of the following most accurately distinguishes challenger banks from neobanks, based on their operational and regulatory structure?",
    options: [
      "Challenger banks are always branchless and partner exclusively with traditional banks for deposits, while neobanks hold full banking licenses.",
      "Challenger banks typically hold full banking licenses to offer core services like loans independently, whereas neobanks are digital-only platforms often partnering with licensed banks without their own licenses.",
      "Both are identical in lacking lending capacity, focusing only on payments like payment banks.",
      "Neobanks emphasize physical branches for customer service, unlike digital-first challenger banks."
    ],
    answer: 1
  },
  {
    question: "Payment Banks Limitations: Under RBI guidelines for Indian payment banks (e.g., Paytm Payments Bank, Airtel Payments Bank), which statement correctly reflects their core restrictions and objectives?",
    options: [
      "They offer full lending services to compete with small finance banks, with no deposit caps.",
      "Designed for financial inclusion, they accept deposits up to ₹200,000 per customer, enable payments/remittances/debit cards, but cannot issue loans or credit cards independently.",
      "They function as neobanks with unlimited savings accounts and AI-driven credit scoring.",
      "Their primary revenue comes from equity crowdfunding integration."
    ],
    answer: 1
  },
  {
    question: "Embedded Finance Model: In the context of embedded finance transforming financial services, which example best illustrates its mechanism of integrating services into non-financial platforms, as opposed to standalone P2P lending or crowdfunding?",
    options: [
      "Platforms like Kickstarter raising equity funds directly from crowds for startups.",
      "P2P sites connecting borrowers/lenders via tech scoring, bypassing banks entirely.",
      "Buy Now Pay Later (BNPL) or loans offered at e-commerce checkout (e.g., Flipkart-PhonePe) or payments within ride-hailing apps like Ola-HDFC, embedding finance seamlessly into user journeys.",
      "Neobanks like Open providing app-only accounts without platform partnerships."
    ],
    answer: 2
  },
  {
    question: "Which of the following is NOT a core component of a digital payment system?",
    options: [
      "Payer",
      "Payee",
      "Payment gateway",
      "Physical cash vault"
    ],
    answer: 3
  },
  {
    question: "In UPI transaction flow, which entity routes the transaction request to the payer’s bank?",
    options: [
      "Payment gateway",
      "NPCI",
      "Acquiring bank",
      "Merchant processor"
    ],
    answer: 1
  },
  {
    question: "What is the main role of a BNPL provider in a transaction?",
    options: [
      "Only provide the merchant with software",
      "Pay the merchant and collect installments from the customer",
      "Issue debit cards to customers",
      "Process UPI transactions"
    ],
    answer: 1
  },
  {
    question: "Which of the following is an emerging fintech area that provides lending, borrowing, and trading WITHOUT traditional intermediaries?",
    options: [
      "NFTs",
      "Cloud Computing",
      "DeFi",
      "Business Development"
    ],
    answer: 2
  },
  {
    question: "Embedded Finance refers to:",
    options: [
      "Using blockchain for financial transactions",
      "Financial services offered only by banks",
      "Integrating financial services into non-financial platforms like e-commerce or ride-sharing apps",
      "Cloud-based trading platforms"
    ],
    answer: 2
  },
  {
    question: "Which of the following is a key way to strengthen a fintech resume or portfolio?",
    options: [
      "Avoid including technical projects",
      "Focus only on academic marks",
      "Maintain an active GitHub or portfolio website showcasing fintech projects",
      "Mention only non-financial internships"
    ],
    answer: 2
  },
  {
    question: "Machine Learning is widely used in finance to:",
    options: [
      "Print currency notes",
      "Detect fraud and manage credit risk",
      "Replace banks completely",
      "Store cash digitally"
    ],
    answer: 1
  },
  {
    question: "Which AI technique is used to analyze customer reviews or chat messages?",
    options: [
      "Supervised Learning",
      "Unsupervised Learning",
      "Natural Language Processing (NLP)",
      "Reinforcement Learning"
    ],
    answer: 2
  },
  {
    question: "Robo-advisors are:",
    options: [
      "Human financial advisors in banks",
      "Automated AI-based platforms that give investment advice",
      "Loan officers in fintech companies",
      "Credit scoring agencies"
    ],
    answer: 1
  },
  {
    question: "Which SQL function is used to calculate the average value of a numeric column in a financial dataset?",
    options: [
      "COUNT()",
      "SUM()",
      "AVG()",
      "GROUP BY"
    ],
    answer: 2
  },
  {
    question: "Why is data cleaning and preprocessing important in financial data analysis?",
    options: [
      "To increase data size",
      "To make data visually attractive",
      "To ensure accuracy and consistency before analysis",
      "To eliminate the need for visualization tools"
    ],
    answer: 2
  },
  {
    question: "In data visualization dashboards, filters and slicers are mainly used to:",
    options: [
      "Change database structure",
      "Remove errors from data",
      "Allow users to interactively explore specific segments of data",
      "Convert data into SQL queries"
    ],
    answer: 2
  },
  {
    question: "In the UPI transaction process, which sequence is CORRECT?",
    options: [
      "User → Acquiring Bank → NPCI → Issuer Bank → Payee",
      "User → NPCI → Payer’s Bank → Payee’s Bank → Confirmation",
      "User → Payment Gateway → Processor → NPCI → Payee",
      "User → Wallet Provider → Acquirer → Issuer → NPCI"
    ],
    answer: 1
  },
  {
    question: "Immutability in blockchain means:",
    options: [
      "Data can be edited anytime by miners",
      "Data can be deleted after validation",
      "Once recorded, data cannot be changed without network consensus",
      "Only banks can modify blockchain records"
    ],
    answer: 2
  },
  {
    question: "Smart contracts are:",
    options: [
      "Legal contracts signed by lawyers",
      "Manual agreements stored in banks",
      "Self-executing programs that run automatically on blockchain when conditions are met",
      "Tokens used only for trading"
    ],
    answer: 2
  },
  {
    question: "Which of the following BEST explains the role of a “block” in a blockchain?",
    options: [
      "A computer that validates transactions",
      "A group of transactions linked with cryptographic hashes and timestamps",
      "A type of cryptocurrency wallet",
      "A central authority controlling the blockchain"
    ],
    answer: 1
  },
  {
    question: "A fintech company using AI to block suspicious transactions in real-time is primarily applying which cybersecurity concept?",
    options: [
      "Static rule-based filtering",
      "Threat detection and behavioral analytics",
      "Social engineering prevention",
      "Penetration testing"
    ],
    answer: 1
  },
  {
    question: "In AML compliance, which activity is MOST critical for detecting money laundering risks?",
    options: [
      "Customer password reset policies",
      "Transaction monitoring and suspicious activity reporting",
      "Encryption of databases",
      "Biometric authentication"
    ],
    answer: 1
  },
  {
    question: "In open banking, APIs primarily allow banks to:",
    options: [
      "Close their systems to third parties",
      "Share customer data securely with authorized third parties with consent",
      "Eliminate the need for regulations",
      "Replace core banking systems"
    ],
    answer: 1
  },
  {
    question: "Under PSD2, Strong Customer Authentication (SCA) requires:",
    options: [
      "Only a username and password",
      "Only biometric verification",
      "At least two authentication factors (knowledge, possession, or inherence)",
      "No authentication for small payments"
    ],
    answer: 2
  },
  {
    question: "Which of the following is an example of a Payment Initiation Service (PIS)?",
    options: [
      "Aggregating customer bank account data",
      "Initiating payments directly from a customer’s bank account via an API",
      "Sending promotional banking emails",
      "Storing customer passwords"
    ],
    answer: 1
  }
];

export default function FintechQuiz() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState(
    new Array(questions.length).fill(null)
  );

  const [score, setScore] = useState(null);
  const [attemptsUsed, setAttemptsUsed] = useState(1);
  const [passed, setPassed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const maxAttempts = 3;

  const handleAnswer = (questionIndex, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
    setErrorMessage("");
  };

  const submitQuiz = async () => {
    if (!user) {
      setErrorMessage("Login required.");
      return;
    }

    if (answers.includes(null)) {
      setErrorMessage("Please answer all questions.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);

    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });

    setScore(correct);

    try {
      const token = await user.getToken();

      const res = await fetch("http://localhost:3000/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: COURSE_ID,
          score: correct,
          totalQuestions: questions.length,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message);
        setLoading(false);
        return;
      }

      // IMPORTANT FIX
      setAttemptsUsed(data.result.attemptsUsed);
      setPassed(data.result.passed);

      window.scrollTo({ top: 0, behavior: "smooth" });

      // AUTO REDIRECT AFTER PASS
      if (data.result.passed) {
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      }

      // AUTO REDIRECT AFTER MAX ATTEMPTS
      if (
        data.result.attemptsUsed >= data.result.maxAttempts &&
        !data.result.passed
      ) {
        setTimeout(() => {
          navigate("/dashboard");
        }, 4000);
      }

    } catch (err) {
      console.error(err);
      setErrorMessage("Server error");
    }

    setLoading(false);
  };

  const handleRetake = () => {
    if (attemptsUsed < maxAttempts) {
      setAnswers(new Array(questions.length).fill(null));
      setScore(null);
      setErrorMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // The passing score variable is kept here in case you need it for future UI logic, 
  // though your backend is currently deciding the true 'passed' state.
  const passingScore = Math.ceil(questions.length * 0.75);

  return (
    <div className="quiz-wrapper">
      <div className="quiz-header-card">
        <h1>FinTech Quiz</h1>
        <p className="quiz-subtitle">
          Complete the quiz to unlock certification
        </p>
        <div className="quiz-meta">
          Attempt {attemptsUsed} / {maxAttempts}
        </div>
        {errorMessage && (
          <div className="error-banner">
            {errorMessage}
          </div>
        )}
      </div>

      {score === null ? (
        <div className="questions-list">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-text">
                Q{qIndex + 1}. {q.question}
              </div>
              <div className="options-container">
                {q.options.map((opt, optIndex) => (
                  <button
                    key={optIndex}
                    onClick={() => handleAnswer(qIndex, optIndex)}
                    className={`quiz-option ${
                      answers[qIndex] === optIndex ? "selected" : ""
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="submit-card">
            <button
              onClick={submitQuiz}
              className="quiz-submit btn-primary"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </div>
      ) : (
        <div className="result-card">
          <h2>Quiz Result</h2>
          <div className="score-display">
            {score} / {questions.length}
          </div>

          {passed ? (
            <>
              <div className="quiz-pass">PASS ✅</div>
              <p>Redirecting to dashboard...</p>
            </>
          ) : (
            <>
              <div className="quiz-fail">FAIL ❌</div>
              {attemptsUsed < maxAttempts ? (
                <button
                  onClick={handleRetake}
                  className="quiz-submit btn-secondary"
                >
                  Retake Quiz
                </button>
              ) : (
                <p>No attempts remaining. Redirecting...</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}