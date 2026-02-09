import React from "react";

const FoundersSection = () => {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        borderRadius: "12px",
        padding: "32px",
        marginBottom: "45px",
        boxShadow: "0 4px 20px rgba(139, 115, 85, 0.08)",
        border: "1px solid rgba(139, 115, 85, 0.15)",
      }}
    >
      <p
        style={{
          fontSize: "1.05rem",
          lineHeight: "1.9",
          color: "#4a4a4a",
          marginBottom: "0",
        }}
      >
        This website is actually started and <strong>FULLY developed</strong> by 2 high
        school students: <strong style={{ color: "#8b7355" }}>Quanhao Li (CataDragon)</strong> and{" "}
        <strong style={{ color: "#8b7355" }}>Jorlanda Chen</strong>? They are young dreamers,
        PRO chess players, and are trying to easier chess players' lives:
      </p>
    </div>
  );
};

export default FoundersSection;
