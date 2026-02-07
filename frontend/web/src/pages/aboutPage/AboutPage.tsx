import React from "react";
import Intro from "./Intro";
import Developer from "./Developer";
import UserManual from "./userManual";

const AboutPage = () => {
  return (
    <div
      style={{
        padding: "28px 24px 40px",
        fontFamily: "'Roboto', sans-serif",
        background:
          "radial-gradient(circle at top, rgba(250, 246, 242, 0.9) 0%, rgba(240, 230, 218, 0.9) 45%, rgba(233, 220, 207, 0.9) 100%)",
        // Keep content scrollable beneath the fixed header.
        maxHeight: "calc(100vh - 64px)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <Intro />
        <Developer />
        <UserManual />
      </div>
    </div>
  );
};

export default AboutPage;
