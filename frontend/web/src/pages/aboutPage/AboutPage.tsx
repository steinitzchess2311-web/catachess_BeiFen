import React, { useState } from "react";
import PageTransition from "../../components/animation/PageTransition";
import SideNav from "../../components/navigation/SideNav";
import HeroSection from "./HeroSection";
import FoundersSection from "./FoundersSection";
import ProblemsSection from "./ProblemsSection";
import SolutionSection from "./SolutionSection";
import ImitatorSection from "./ImitatorSection";
import Promises from "./Promises";

const AboutPage = () => {
  const [isSideNavOpen, setIsSideNavOpen] = useState(true);

  const navItems = [
    { id: "hero", label: "Why We're Great", icon: "📍" },
    { id: "founders", label: "Meet the Founders", icon: "👥" },
    { id: "problems", label: "The Problem", icon: "⚠️" },
    { id: "solution", label: "Our Solution", icon: "✨" },
    { id: "imitator", label: "ChessorTag Imitator", icon: "🤖" },
    { id: "promises", label: "Our Promises", icon: "🤝" },
  ];

  return (
    <PageTransition>
      <div
        style={{
          padding: "40px 24px 70px",
          fontFamily: "'Roboto', sans-serif",
          background:
            "linear-gradient(135deg, rgba(250, 248, 245, 0.95) 0%, rgba(245, 242, 238, 0.95) 50%, rgba(242, 238, 233, 0.95) 100%)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <div
          style={{
            maxWidth: isSideNavOpen ? "1400px" : "1100px",
            margin: "0 auto",
            paddingLeft: isSideNavOpen ? "260px" : "100px",
            transition: "max-width 0.3s ease, padding-left 0.3s ease",
          }}
        >
          {/* Left Sidebar Navigation */}
          <SideNav items={navItems} isOpen={isSideNavOpen} onOpenChange={setIsSideNavOpen} />

          {/* Main Content */}
          <div style={{ width: "100%" }}>
            <div id="hero">
              <HeroSection />
            </div>
            <div id="founders">
              <FoundersSection />
            </div>
            <div id="problems">
              <ProblemsSection />
            </div>
            <div id="solution">
              <SolutionSection />
            </div>
            <div id="imitator">
              <ImitatorSection />
            </div>
            <div id="promises">
              <Promises />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AboutPage;
