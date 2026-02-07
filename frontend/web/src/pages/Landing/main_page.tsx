import React from "react";

const MainPage = () => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40% 1fr",
        gap: "50px",
        alignItems: "center",
        padding: "50px",
        border: "2px solid #000",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          border: "2px solid #000",
          width: "100%",
          aspectRatio: "1 / 1",
          justifySelf: "center",
        }}
      />
      <div style={{ border: "2px solid #000", height: "100%" }} />
    </div>
  );
};

export default MainPage;
