import React from "react";
import { Link } from "react-router-dom";

const MainPage = () => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40% 1fr",
        gap: "0",
        alignItems: "center",
        padding: "50px",
        border: "2px solid transparent",
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
          border: "2px solid transparent",
          height: "100%",
          padding: "28px 32px 28px 0",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "37px",
        }}
      >
        <div
          style={{
            fontSize: "40px",
            fontWeight: 700,
            lineHeight: 1.2,
            textAlign: "right",
          }}
        >
          Join Us to Learn from World Chess Champions!
        </div>
        <div style={{ fontSize: "18px", lineHeight: 1.6, color: "#2f2a26", textAlign: "right" }}>
          Unlock your own personal virtual Grandmaster Coach! You may
          <br />
          select from Bobby Fischer, Garry Kasparov, Ding Liren, Mihail Tal,
          <br />
          Petrosian, and so much more!
        </div>
        <Link
          to="/login"
          style={{
            alignSelf: "flex-end",
            border: "2px solid #000",
            padding: "12px 24px",
            fontSize: "18px",
            fontWeight: 600,
            color: "inherit",
            textDecoration: "none",
          }}
        >
          Start your journey
        </Link>
      </div>
    </div>
  );
};

export default MainPage;
