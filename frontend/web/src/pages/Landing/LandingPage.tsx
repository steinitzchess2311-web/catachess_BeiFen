import React from "react";

const LandingPage = () => {
  return (
    <div
      style={{
        // Allow vertical scrolling when content overflows.
        overflowY: "auto",
        overflowX: "hidden",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60% 1fr",
          gap: "24px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            border: "2px solid #000",
            height: "100%",
          }}
        />
        <div
          style={{
            border: "2px solid #000",
            width: "100%",
            aspectRatio: "1 / 1",
            justifySelf: "center",
          }}
        />
      </div>
    </div>
  );
};

export default LandingPage;
