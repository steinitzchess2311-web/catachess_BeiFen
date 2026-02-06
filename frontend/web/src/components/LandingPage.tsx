import React from "react";
import { Link, Navigate } from "react-router-dom";
import "./LandingPage.css";

interface LandingPageProps {
  isAuthed: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ isAuthed }) => {
  if (isAuthed) {
    return <Navigate to="/workspace-select" replace />;
  }

  return (
    <section className="landing-page">
      <div className="landing-card">
        <h1>Welcome to ChessorTag.org!</h1>
        <p>
          Want to learn from former World Chess Champions? Want to know your playing weakness and strengths? Want to see how you perform in different aspects compared to World Chess Championship Candidates? You are in the right place!
        </p>
        <p>
          Create an account today to access your detailed report that evaluates you on multiple dimensions, comparing your performance to the top grandmasters! You may also select a famous player as your own virtual coach! The choices include Bobby Fischer, Garry Kasparov, Ding Liren, Mihail Tal, Petrosian, and so much more! Come unlock your own personal grandmaster coach.
        </p>
        <div className="landing-actions">
          <Link className="ghost" to="/login?redirect=/workspace-select">Login</Link>
          <Link className="cta cta-primary" to="/signup?redirect=/workspace-select">Sign up</Link>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
