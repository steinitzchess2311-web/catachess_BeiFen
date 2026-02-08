import React from "react";
import { Link } from "react-router-dom";

const OrganizeIntro = () => {
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
      {/* Left: Placeholder square box for image */}
      <div
        style={{
          border: "2px solid #ddd",
          width: "100%",
          aspectRatio: "1 / 1",
          justifySelf: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Placeholder - image will be added later */}
      </div>

      {/* Right: Text content (right-aligned) */}
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
          Freely Organize Your Chess Materials!
        </div>
        <div
          style={{
            fontSize: "18px",
            lineHeight: 1.6,
            color: "#2f2a26",
            textAlign: "right",
          }}
        >
          We serve as your FREE online ChessBase that allows you to effectively organize your chess materials!
        </div>
        <Link
          to="/workspace-select"
          className="landing-button"
          style={{
            alignSelf: "flex-end",
            backgroundColor: "#1A73E8",
            border: "2px solid #1A73E8",
            borderRadius: "8px",
            padding: "12px 24px",
            fontSize: "18px",
            fontWeight: 600,
            color: "white",
            textDecoration: "none",
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
          Get Started for Free
        </Link>
      </div>
    </div>
  );
};

export default OrganizeIntro;
