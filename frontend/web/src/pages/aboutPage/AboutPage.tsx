import React from "react";
import HeroSection from "../SponsorshipPage/HeroSection";
import FoundersSection from "../SponsorshipPage/FoundersSection";
import ProblemsSection from "../SponsorshipPage/ProblemsSection";
import SolutionSection from "../SponsorshipPage/SolutionSection";
import ImitatorSection from "../SponsorshipPage/ImitatorSection";
import CTASection from "../SponsorshipPage/CTASection";

const AboutPage = () => {
  return (
    <div
      style={{
        padding: "40px 24px 70px",
        fontFamily: "'Roboto', sans-serif",
        background:
          "linear-gradient(135deg, rgba(250, 248, 245, 0.95) 0%, rgba(245, 242, 238, 0.95) 50%, rgba(242, 238, 233, 0.95) 100%)",
        minHeight: "calc(100vh - 64px)",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <HeroSection />
        <FoundersSection />
        <ProblemsSection />
        <SolutionSection />
        <ImitatorSection />
        <CTASection />
      </div>
    </div>
  );
};

export default AboutPage;
