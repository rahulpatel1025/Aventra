import "./App.css";
import { Routes, Route } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react"; // ✅ Added useAuth
import { useEffect } from "react";
import axios from "axios";
import ScrollToTop from "./Components/Pages/ScrollToTop";

// Pages
import Home from "./Components/Pages/Home";
import About1 from "./Components/Routes/About1";
import Courses1 from "./Components/Routes/Courses1";
import Team1 from "./Components/Routes/Team1";
import Testimonial1 from "./Components/Routes/Testimonial1";
import Contact1 from "./Components/Routes/Contact1";
import ErrorPage from "./Components/Pages/ErrorPage";
import SignUp from "./Components/Pages/Register";
import Profile from "./Components/Pages/Profile";
import Dashboard from "./Components/Pages/Dashboard";
import FeedbackAll from "./Components/Pages/FeedbackAll";

// Courses
import Javaprog from "./Components/Course/Javaprog";
import Dsa from "./Components/Course/Dsa";
import Mern from "./Components/Course/Mern";
import Fullstack from "./Components/Course/Fullstack";
import Programming from "./Components/Course/Programming";
import Reactjs from "./Components/Course/Reactjs";
import Express from "./Components/Course/Express";
import Nodejs from "./Components/Course/Nodejs";
import Mongodb from "./Components/Course/Mongodb";
import Mysql from "./Components/Course/Mysql";
import Javascript from "./Components/Course/Javascript";
import Html from "./Components/Course/Html";
import Css from "./Components/Course/Css";
import Advjava from "./Components/Course/Advjava";

// Quiz
import FintechQuiz from "./Components/Quiz/FintechQuiz";

// Ebook & Chatbot
import ShowBook from "./Components/Ebook/ShowBook";
import BotpressChatbot from "./Components/Ebook/BotpressChatbot";

// Checkout
import CheckoutDetails from "./Components/Pages/CheckoutDetails";
import CheckoutReferral from "./Components/Pages/CheckoutReferral";
import CheckoutPayment from "./Components/Pages/CheckoutPayment";
import FintechCourseDetails from "./Components/Pages/FintechCourseDetails";

function App() {
  // ✅ Extract isSignedIn as well to ensure they are fully logged in
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth(); // ✅ Get the token function from useAuth

  // 🔥 GLOBAL AUTO-SYNC USING BACKEND
  useEffect(() => {
    // Only run if Clerk is loaded and the user is actually signed in
    if (!isLoaded || !isSignedIn || !user) return;

    const triggerAutoSync = async () => {
      try {
        const token = await getToken(); // ✅ Correct token extraction

        // ✅ Use POST and hit the sync route we built in the backend
        await axios.post(
          "http://localhost:3000/api/user/sync",
          {
            clerkId: user.id,
            fullName: user.fullName,
            // Fallback for Apple ID "Hide My Email" users
            email: user.primaryEmailAddress?.emailAddress || "hidden-apple-email@apple.com",
            profileImage: user.imageUrl,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("✅ User auto-synced successfully");
      } catch (err) {
        console.error("❌ Auto-sync failed:", err);
      }
    };

    triggerAutoSync();
  }, [user, isLoaded, isSignedIn, getToken]);

  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* MAIN PAGES */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About1 />} />
        <Route path="/courses" element={<Courses1 />} />
        <Route path="/team" element={<Team1 />} />
        <Route path="/testimonial" element={<Testimonial1 />} />
        <Route path="/contact" element={<Contact1 />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* AUTH / PROFILE */}
        <Route path="/register" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />

        {/* QUIZ */}
        <Route path="/quiz/fintech" element={<FintechQuiz />} />

        {/* COURSES */}
        <Route path="/courses/java" element={<Javaprog />} />
        <Route path="/courses/dsa" element={<Dsa />} />
        <Route path="/courses/mern" element={<Mern />} />
        <Route path="/courses/mern/nodejs" element={<Nodejs />} />
        <Route path="/courses/mern/express" element={<Express />} />
        <Route path="/courses/mern/react" element={<Reactjs />} />
        <Route path="/courses/mern/mongodb" element={<Mongodb />} />

        <Route path="/courses/fullstack" element={<Fullstack />} />
        <Route path="/courses/fullstack/sql" element={<Mysql />} />
        <Route path="/courses/fullstack/nodejs" element={<Nodejs />} />
        <Route path="/courses/fullstack/express" element={<Express />} />
        <Route path="/courses/fullstack/react" element={<Reactjs />} />
        <Route path="/courses/fullstack/mongodb" element={<Mongodb />} />
        <Route path="/courses/fullstack/javascript" element={<Javascript />} />
        <Route path="/courses/fullstack/html" element={<Html />} />
        <Route path="/courses/fullstack/css" element={<Css />} />

        {/* PROGRAMMING */}
        <Route path="/cources/programming" element={<Programming />} />
        <Route path="/cources/programming/java" element={<Javaprog />} />
        <Route path="/cources/programming/advJava" element={<Advjava />} />
        <Route path="/cources/programming/javascript" element={<Javascript />} />

        {/* LIBRARY & FEEDBACK */}
        <Route path="/library" element={<ShowBook />} />
        <Route path="/feedback" element={<FeedbackAll />} />

        <Route path="/courses/:slug" element={<FintechCourseDetails />} />

        {/* CHECKOUT */}
        <Route path="/checkout/details" element={<CheckoutDetails />} />
        <Route path="/checkout/referral" element={<CheckoutReferral />} />
        <Route path="/checkout/payment" element={<CheckoutPayment />} />

        {/* ERROR */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>

      {/* GLOBAL CHATBOT */}
      <BotpressChatbot />
    </>
  );
}

export default App;