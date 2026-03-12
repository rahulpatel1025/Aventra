import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import "../../assets/css/navbar.css";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false); // Default to light mode for this aesthetic
  const [menuOpen, setMenuOpen] = useState(false);

  // Auto detect theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      setDarkMode(true);
    } else {
      document.body.classList.remove("dark-mode");
      setDarkMode(false);
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDarkMode(isDark);
  };

  return (
    <><nav className={`modern-navbar ${menuOpen ? "active" : ""}`}>

      {/* Logo */}
      <NavLink to="/" className="logo">
        <img
          src="/img/aventra-logo.png"
          alt="Aventra Logo"
          className="logo-img"
          style={{ height: "24px" }} // Keeping logo tight for the pill shape
        />
      </NavLink>

      {/* 🍔 Mobile Toggle Button */}
      <button
        className={`hamburger ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <img
          src="/img/menu-white.png"
          alt="menu"
          className="hamburger-icon"
          style={{ filter: darkMode ? 'none' : 'invert(1)' }} // Invert for light mode
        />
      </button>

      {/* Center Menu */}
      <div className={`menu ${menuOpen ? "active" : ""}`}>
        <NavLink to="/" onClick={() => setMenuOpen(false)}>
          Home
        </NavLink>
        <NavLink to="/about" onClick={() => setMenuOpen(false)}>
          About
        </NavLink>
        <NavLink to="/courses" onClick={() => setMenuOpen(false)}>
          Courses
        </NavLink>
        <NavLink to="/contact" onClick={() => setMenuOpen(false)}>
          Contact
        </NavLink>
      </div>

      {/* Right Actions */}
      <div className="actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>

        {/* Theme Toggle */}
        <button
          className="icon-btn theme-toggle"
          onClick={toggleTheme}
          style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* If User is NOT logged in */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="primary-btn">Join</button>
          </SignInButton>
        </SignedOut>

        {/* If User IS logged in */}
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

      </div>
    </nav><div className="navbar-backdrop" onClick={() => setMenuOpen(false)}></div></>
  );
}