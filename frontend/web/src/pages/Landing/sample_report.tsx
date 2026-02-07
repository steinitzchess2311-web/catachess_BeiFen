import React from "react";

const SampleReport = () => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60% 1fr",
        gap: "0",
        alignItems: "center",
        padding: "50px",
        border: "2px solid #000",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          border: "2px solid #000",
          height: "100%",
          padding: "28px 32px 28px 0",
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
          <div
            style={{
              border: "2px solid #000",
              padding: "12px 24px",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            See Sample Report
          </div>
          <div
            style={{
              border: "2px solid #000",
              padding: "12px 24px",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            Create Your Own
          </div>
        </div>
      </div>
      <div
        style={{
          border: "2px solid #000",
          width: "100%",
          aspectRatio: "1 / 1",
          justifySelf: "center",
        }}
      />
    </div>
  );
};

export default SampleReport;
