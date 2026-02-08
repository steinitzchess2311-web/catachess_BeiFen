import React from "react";
import sampleReportImage from "../../assets/photos/sample_report.jpg";

const SampleReport = () => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60% 1fr",
        gap: "0",
        alignItems: "center",
        padding: "50px",
        border: "2px solid transparent",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          border: "2px solid transparent",
          height: "100%",
          padding: "28px 0 28px 32px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "37px",
        }}
      >
        <div style={{ fontSize: "40px", fontWeight: 700, lineHeight: 1.2 }}>
          Familiar with Your Strengths and Weaknesses Across Multiple Games ?
        </div>
        <div style={{ fontSize: "18px", lineHeight: 1.6, color: "#2f2a26" }}>
          Generate your report today to see your performance compared to World Candidates!
        </div>
        <div style={{ display: "flex", gap: "40px" }}>
          <a
            href="/sample_reports/yuyaochen_report.html"
            target="_blank"
            rel="noreferrer"
            className="landing-button"
            style={{
              backgroundColor: "#1A73E8",
              border: "2px solid #1A73E8",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "18px",
              fontWeight: 600,
              lineHeight: 1,
              color: "white",
              textDecoration: "none",
              display: "inline-block",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#1A73E8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1A73E8";
              e.currentTarget.style.color = "white";
            }}
          >
            See Sample Report
          </a>
          <div
            className="landing-button"
            style={{
              backgroundColor: "#1A73E8",
              border: "2px solid #1A73E8",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "18px",
              fontWeight: 600,
              lineHeight: 1,
              color: "white",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#1A73E8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1A73E8";
              e.currentTarget.style.color = "white";
            }}
          >
            Create Your Own
          </div>
        </div>
      </div>
      <div
        style={{
          border: "2px solid transparent",
          width: "100%",
          aspectRatio: "1 / 1",
          justifySelf: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={sampleReportImage}
          alt="Sample report"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </div>
  );
};

export default SampleReport;
