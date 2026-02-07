import React from "react";
import MainPage from "./main_page";
import SampleReport from "./sample_report";

const LandingPage = () => {
  return (
    <div
      style={{
        // Allow vertical scrolling when content overflows.
        overflowY: "auto",
        overflowX: "hidden",
        padding: "72px 60px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "50px" }}>
        <MainPage />
        <SampleReport />
      </div>
    </div>
  );
};

export default LandingPage;
