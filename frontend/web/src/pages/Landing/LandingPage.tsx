import React, { useState, useEffect } from "react";
import TestSign from "../../components/dialogBox/TestSign";
import MainPage from "./main_page";
import SampleReport from "./sample_report";
import OrganizeIntro from "./organize_intro";
import IntroAnimation from "./IntroAnimation";

const LandingPage = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [hasShownIntro, setHasShownIntro] = useState(false);

  // Check if intro has been shown in this session
  useEffect(() => {
    const introShown = sessionStorage.getItem("landingIntroShown");
    if (introShown === "true") {
      setShowIntro(false);
      setHasShownIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setHasShownIntro(true);
    sessionStorage.setItem("landingIntroShown", "true");
  };

  return (
    <>
      {/* Intro Animation - Only shown once per session */}
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      {/* Main Landing Page Content */}
      <div
        style={{
          // Allow vertical scrolling when content overflows.
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: "border-box",
          opacity: hasShownIntro ? 1 : 0,
          transition: "opacity 0.5s ease-in",
        }}
      >
        <TestSign floating={true} />
        <div style={{ padding: "72px 60px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "50px" }}>
            <MainPage />
            <SampleReport />
            <OrganizeIntro />
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
