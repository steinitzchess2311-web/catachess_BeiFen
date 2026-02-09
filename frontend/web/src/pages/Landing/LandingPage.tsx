import React from "react";
import TestSign from "../../components/dialogBox/TestSign";
import MainPage from "./main_page";
import SampleReport from "./sample_report";
import OrganizeIntro from "./organize_intro";

const LandingPage = () => {
  return (
    <div
      style={{
        // Allow vertical scrolling when content overflows.
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
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
  );
};

export default LandingPage;
