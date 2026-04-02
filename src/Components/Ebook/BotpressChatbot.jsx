import React, { useState, useRef, useEffect } from "react";

// ─── 1. PREBUILT QUESTIONS & ANSWERS ───
const FAQ_DATA = [
  {
    id: "q1",
    question: "📚 What courses do you offer?",
    answer: "We offer industry-aligned courses in FinTech, MERN Stack Development, Java, Data Structures & Algorithms, and OData.",
  },
  {
    id: "q2",
    question: "🏆 How do I get a certificate?",
    answer: "To earn a certificate, you need to watch all the video lessons in a course and pass the final course quiz with a score of 75% or higher.",
  },
  {
    id: "q3",
    question: "💼 Do you offer internships?",
    answer: "Yes! Top-performing students who complete our professional courses gain access to exclusive internship opportunities with our partner companies.",
  },
  {
    id: "q4",
    question: "📞 How can I contact support?",
    answer: "You can reach us anytime at support@aventratechsolution.com or by using the Contact page in the top menu.",
  },
];

export default function BotpressChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi there! 👋 I'm the Aventra Guide Bot. How can I help you today?" }
  ]);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleOptionClick = (qa) => {
    // 1. Add user's question to the chat
    setMessages((prev) => [...prev, { sender: "user", text: qa.question }]);

    // 2. Add a tiny delay to make it feel natural, then show the answer
    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "bot", text: qa.answer }]);
    }, 400);
  };

  return (
    <>
      {/* ─── CHAT WINDOW ─── */}
      <div style={{
        position: "fixed", bottom: 80, right: 20, width: 350, height: 450,
        backgroundColor: "#ffffff", borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        display: isOpen ? "flex" : "none", flexDirection: "column", overflow: "hidden", zIndex: 9999,
        border: "1px solid #e2e8f0"
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: "#2563eb", color: "white", padding: "16px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontWeight: 600, fontSize: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🤖</span> Aventra Guide
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: 20 }}
          >
            ✕
          </button>
        </div>

        {/* Chat Messages */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto", backgroundColor: "#f8fafc" }}>
          {messages.map((msg, index) => (
            <div key={index} style={{
              display: "flex", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start", marginBottom: 12
            }}>
              <div style={{
                maxWidth: "80%", padding: "10px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.5,
                backgroundColor: msg.sender === "user" ? "#2563eb" : "#ffffff",
                color: msg.sender === "user" ? "#ffffff" : "#334155",
                boxShadow: msg.sender === "bot" ? "0 2px 5px rgba(0,0,0,0.05)" : "none",
                border: msg.sender === "bot" ? "1px solid #e2e8f0" : "none",
                borderBottomRightRadius: msg.sender === "user" ? 2 : 12,
                borderBottomLeftRadius: msg.sender === "bot" ? 2 : 12,
              }}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Options Menu (Always shows below the last message) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 4px 4px" }}>Choose a question:</p>
            {FAQ_DATA.map((qa) => (
              <button
                key={qa.id}
                onClick={() => handleOptionClick(qa)}
                style={{
                  textAlign: "left", padding: "10px 14px", borderRadius: 8,
                  backgroundColor: "#ffffff", border: "1px solid #cbd5e1",
                  color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
              >
                {qa.question}
              </button>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── FLOATING TOGGLE BUTTON ─── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed", bottom: 20, right: 20, width: 56, height: 56,
          borderRadius: "50%", backgroundColor: "#2563eb", color: "white",
          border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
          display: "flex", justifyContent: "center", alignItems: "center", fontSize: 24, zIndex: 10000,
          transition: "transform 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </>
  );
}