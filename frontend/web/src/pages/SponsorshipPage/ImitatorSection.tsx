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
          padding: "32px",
          marginBottom: "20px",
        }}
      >
        {/* How it works */}
        <div style={{ marginBottom: "32px" }}>
          <h4
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#8b7355",
              marginBottom: "16px",
              borderLeft: "4px solid #8b7355",
              paddingLeft: "16px",
            }}
          >
            How it works?
          </h4>
          <p
            style={{
              fontSize: "1.02rem",
              lineHeight: "1.8",
              color: "#4a4a4a",
              marginBottom: "0",
            }}
          >
            We developed our tagger algorithm, which gives each chess move one or more tags, and
            calculates the percentage of different tags in all player's games. We do the imitation
            by calculating the similarities between Stockfish moves and player's tag percentage.
          </p>
        </div>

        {/* What does it do */}
        <div style={{ marginBottom: "32px" }}>
          <h4
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#8b7355",
              marginBottom: "16px",
              borderLeft: "4px solid #8b7355",
              paddingLeft: "16px",
            }}
          >
            What does it do?
          </h4>
          <ul
            style={{
              fontSize: "1.02rem",
              lineHeight: "1.8",
              color: "#4a4a4a",
              paddingLeft: "0",
              listStyleType: "none",
              margin: "0",
            }}
          >
            <li style={{ marginBottom: "12px", paddingLeft: "28px", position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "0",
                  color: "#8b7355",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                ✓
              </span>
              Helps you to <strong>prepare against your opponent easily!</strong> You can have
              clear focus on which opening variation to study deeper when preparing!
            </li>
            <li style={{ marginBottom: "0", paddingLeft: "28px", position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "0",
                  color: "#8b7355",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                ✓
              </span>
              Allows LLMs to <strong>explain moves in the style of a target player</strong> (which
              is epoch-making).
            </li>
          </ul>
        </div>

        {/* Why is it important */}
        <div>
          <h4
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#8b7355",
              marginBottom: "16px",
              borderLeft: "4px solid #8b7355",
              paddingLeft: "16px",
            }}
          >
            Why is it important?
          </h4>
          <ul
            style={{
              fontSize: "1.02rem",
              lineHeight: "1.8",
              color: "#4a4a4a",
              paddingLeft: "0",
              listStyleType: "none",
              margin: "0",
            }}
          >
            <li style={{ marginBottom: "12px", paddingLeft: "28px", position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "0",
                  color: "#8b7355",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                •
              </span>
              This is the <strong>BEST AI-powered chess coaching system</strong>! Unlike human
              coaches, it's available 24/7 and learns from the world's greatest players.
            </li>
            <li style={{ marginBottom: "12px", paddingLeft: "28px", position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "0",
                  color: "#8b7355",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                •
              </span>
              If you give an FEN to ChatGPT or Gemini, they generate wrong ideas. But with our
              system, <strong>LLMs can actively reflect what players are thinking</strong>.
            </li>
            <li style={{ marginBottom: "0", paddingLeft: "28px", position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "0",
                  color: "#8b7355",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                •
              </span>
              Not everyone can access chess coaches. We provide a{" "}
              <strong style={{ color: "#8b7355" }}>
                free and accessible platform for aspiring players
              </strong>{" "}
              who are eager to improve their game.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImitatorSection;
