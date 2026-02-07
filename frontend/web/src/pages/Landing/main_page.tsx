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
      <div
        style={{
          border: "2px solid #000",
          height: "100%",
          padding: "28px 32px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "18px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2 }}>
          Join Us to Learn from World Chess Champions!
        </div>
        <div style={{ fontSize: "18px", lineHeight: 1.6, color: "#2f2a26" }}>
          Unlock your own personal virtual Grandmaster Coach! You may select from
          Bobby Fischer, Garry Kasparov, Ding Liren, Mihail Tal, Petrosian, and so
          much more!
        </div>
        <div
          style={{
            alignSelf: "center",
            border: "2px solid #000",
            padding: "12px 24px",
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          Start your journey
        </div>
      </div>
    </div>
  );
};

export default MainPage;
