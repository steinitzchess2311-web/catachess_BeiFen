import React from "react";

const ImitatorSection = () => {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        borderRadius: "12px",
        padding: "40px",
        marginBottom: "60px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <h2
          style={{
            fontSize: "2.3rem",
            fontWeight: 800,
            color: "#2c2c2c",
            marginBottom: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          And......we got our OWN, NEW thing:
        </h2>
        <h3
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "#8b7355",
            marginBottom: "20px",
          }}
        >
          ChessorTag Imitator!!!!!
        </h3>
      </div>
      <div
        style={{
          background: "rgba(245, 242, 238, 0.5)",
          borderRadius: "10px",
          padding: "28px",
          marginBottom: "20px",
        }}
      >
        <p
          style={{
            fontSize: "1.05rem",
            lineHeight: "1.9",
            color: "#4a4a4a",
            marginBottom: "1.3rem",
          }}
        >
          ChessorTag imitator is our core inventive algorithm that <strong>does not use neural
          network imitation</strong>, but ranks the top 8 Stockfish moves by the{" "}
          <strong style={{ color: "#8b7355" }}>
            probability that a specific player would choose them
          </strong>
          . This......
        </p>
        <ul
          style={{
            fontSize: "0.98rem",
            lineHeight: "1.9",
            color: "#5a5a5a",
            paddingLeft: "1.8rem",
            listStyleType: "none",
          }}
        >
          <li style={{ marginBottom: "14px" }}>
            <span style={{ color: "#8b7355", fontWeight: 700, marginRight: "8px" }}>✓</span>
            Allows LLMs to <strong>explain moves in the style of a target player</strong>{" "}
            (which is epoch-making). If you give an FEN to ChatGPT or Gemini etc, they
            generate wrong ideas. But with our system, <strong>LLMs can actively reflect what
            players are thinking</strong>. We are making TOP players from William Steinitz to
            Magnus Carlsen your <strong style={{ color: "#8b7355" }}>PERSONAL CHESS COACH!</strong>
          </li>
          <li style={{ marginBottom: "14px" }}>
            <span style={{ color: "#8b7355", fontWeight: 700, marginRight: "8px" }}>✓</span>
            Helps you to <strong>prepare against your opponent easily!</strong> You can have
            clear focus on which opening variation to study deeper when preparing!
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ImitatorSection;
