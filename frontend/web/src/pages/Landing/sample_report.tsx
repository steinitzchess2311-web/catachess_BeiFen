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
      <div style={{ border: "2px solid #000", height: "100%" }} />
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
