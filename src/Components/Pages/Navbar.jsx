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
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Auto detect theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      setDarkMode(true);
    } else {
      document.body.classList.add("dark-mode"); // force dark for black theme
      setDarkMode(true);
      localStorage.setItem("theme", "dark");
    }
  }, []);

  // Toggle theme (optional — keep if you want)
  const toggleTheme = () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDarkMode(isDark);
  };

  return (
    <nav className="modern-navbar">

      {/* Logo */}
      <NavLink to="/" className="logo">
        <img
          src="/img/aventra-logo.png"
          alt="Aventra Logo"
          className="logo-img"
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
      <div className="actions">

        {/* Theme Toggle */}
        <button
          className="icon-btn theme-toggle"
          onClick={toggleTheme}
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
    </nav>
  );
}
