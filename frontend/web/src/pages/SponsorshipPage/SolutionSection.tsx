import React from "react";

const SolutionSection = () => {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(139, 115, 85, 0.08) 0%, rgba(160, 130, 95, 0.08) 100%)",
        borderRadius: "12px",
        padding: "35px",
        marginBottom: "60px",
        border: "2px solid rgba(139, 115, 85, 0.2)",
      }}
    >
      <h2
        style={{
          fontSize: "2.1rem",
          fontWeight: 700,
          color: "#8b7355",
          marginBottom: "28px",
          textAlign: "center",
        }}
      >
        How does ChessorTag solve that?
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "20px",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)",
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#8b7355",
              marginBottom: "10px",
            }}
          >
            FREE!
          </h3>
          <p style={{ fontSize: "0.98rem", color: "#5a5a5a", lineHeight: "1.6" }}>
            FREE for all users! No premium tiers, no hidden costs.
          </p>
        </div>
        <div
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)",
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#8b7355",
              marginBottom: "10px",
            }}
          >
            Organized
          </h3>
          <p style={{ fontSize: "0.98rem", color: "#5a5a5a", lineHeight: "1.6" }}>
            Easily create folder and subfolder systems to keep everything neat.
          </p>
        </div>
        <div
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)",
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#8b7355",
              marginBottom: "10px",
            }}
          >
            Clear PGN
          </h3>
          <p style={{ fontSize: "0.98rem", color: "#5a5a5a", lineHeight: "1.6" }}>
            CLEAR PGN parsing technology - import your games seamlessly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SolutionSection;
