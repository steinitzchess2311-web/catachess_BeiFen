import React from "react";
import chessbaseImg from "../../assets/chessbase.jpg";
import lichessImg from "../../assets/lichess.png";
import chesstempoImg from "../../assets/chesstempo.jpg";

const ProblemsSection = () => {
  return (
    <div style={{ marginBottom: "45px" }}>
      <h2
        style={{
          fontSize: "1.9rem",
          fontWeight: 700,
          color: "#2c2c2c",
          marginBottom: "35px",
          textAlign: "center",
        }}
      >
        The Problem with Existing Tools
      </h2>

      {/* ChessBase - Image Left */}
      <div
        style={{
          display: "flex",
          gap: "32px",
          marginBottom: "32px",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.75)",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "0 3px 12px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div style={{ flex: "0 0 9.5%" }}>
          <img
            src={chessbaseImg}
            alt="ChessBase"
            style={{
              width: "100%",
              borderRadius: "6px",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.12)",
            }}
          />
        </div>
        <div style={{ flex: "1" }}>
          <h3
            style={{
              fontSize: "1.35rem",
              fontWeight: 600,
              color: "#8b7355",
              marginBottom: "12px",
            }}
          >
            ChessBase
          </h3>
          <p
            style={{
              fontSize: "0.98rem",
              lineHeight: "1.7",
              color: "#5a5a5a",
            }}
          >
            Pro players are all using ChessBase to keep their chess repertoires and materials
            organized, yet ChessBase is <strong>REALLY unfriendly</strong> towards normal chess
            players: <strong>Extremely unfriendly for Mac users</strong>, and,{" "}
            <strong>EXPENSIVE!</strong>
          </p>
        </div>
      </div>

      {/* Lichess - Image Right */}
      <div
        style={{
          display: "flex",
          gap: "32px",
          marginBottom: "32px",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.75)",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "0 3px 12px rgba(0, 0, 0, 0.06)",
          flexDirection: "row-reverse",
        }}
      >
        <div style={{ flex: "0 0 9.5%" }}>
          <img
            src={lichessImg}
            alt="Lichess Study"
            style={{
              width: "100%",
              borderRadius: "6px",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.12)",
            }}
          />
        </div>
        <div style={{ flex: "1" }}>
          <h3
            style={{
              fontSize: "1.35rem",
              fontWeight: 600,
              color: "#8b7355",
              marginBottom: "12px",
            }}
          >
            Lichess Study
          </h3>
          <p
            style={{
              fontSize: "0.98rem",
              lineHeight: "1.7",
              color: "#5a5a5a",
            }}
          >
            Lichess study is good! However, you <strong>cannot intuitively organize</strong>{" "}
            your materials! You cannot create <strong>folders and subfolders</strong> to keep
            your materials organized.
          </p>
        </div>
      </div>

      {/* ChessTempo - Image Left */}
      <div
        style={{
          display: "flex",
          gap: "32px",
          marginBottom: "32px",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.75)",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "0 3px 12px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div style={{ flex: "0 0 9.5%" }}>
          <img
            src={chesstempoImg}
            alt="ChessTempo"
            style={{
              width: "100%",
              borderRadius: "6px",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.12)",
            }}
          />
        </div>
        <div style={{ flex: "1" }}>
          <h3
            style={{
              fontSize: "1.35rem",
              fontWeight: 600,
              color: "#8b7355",
              marginBottom: "12px",
            }}
          >
            ChessTempo Opening
          </h3>
          <p
            style={{
              fontSize: "0.98rem",
              lineHeight: "1.7",
              color: "#5a5a5a",
            }}
          >
            ChessTempo opening is also good! But there are{" "}
            <strong>limitations when opening a PGN file</strong>, making it harder to import
            your existing chess materials.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProblemsSection;
