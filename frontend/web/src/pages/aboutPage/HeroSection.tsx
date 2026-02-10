import React from "react";

const HeroSection = () => {
  return (
    <div
      style={{
        textAlign: "center",
        marginBottom: "50px",
      }}
    >
      <h1
        style={{
          fontSize: "2.8rem",
          fontWeight: 800,
          color: "#2c2c2c",
          marginBottom: "12px",
          letterSpacing: "1px",
        }}
      >
        ABOUT
      </h1>
      <p
        style={{
          fontSize: "1.4rem",
          fontWeight: 600,
          color: "#8b7355",
          marginBottom: "0",
        }}
      >
        --We introduce you to the one and only, 24k, ChessorTag!
      </p>
    </div>
  );
};

export default HeroSection;
