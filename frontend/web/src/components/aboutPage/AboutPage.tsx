import React from "react";
import Intro from "./Intro";
import Developer from "./Developer";

const AboutPage = () => {
  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "'Roboto', sans-serif",
        // Keep content scrollable beneath the fixed header.
        maxHeight: "calc(100vh - 64px)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <Intro />
      <Developer />
    </div>
  );
};

export default AboutPage;
