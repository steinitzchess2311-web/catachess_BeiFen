import React from "react";

const FundingPlansSection = () => {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        borderRadius: "12px",
        padding: "35px",
        marginBottom: "60px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      }}
    >
      <h2
        style={{
          fontSize: "1.9rem",
          fontWeight: 700,
          color: "#2c2c2c",
          marginBottom: "28px",
          textAlign: "center",
        }}
      >
        With your funds, we will:
      </h2>
      <ul
        style={{
          fontSize: "1.05rem",
          lineHeight: "2",
          color: "#5a5a5a",
          paddingLeft: "1.8rem",
          listStyleType: "none",
        }}
      >
        <li style={{ marginBottom: "18px" }}>
          <span
            style={{
              display: "inline-block",
              width: "28px",
              height: "28px",
              background: "#8b7355",
              color: "white",
              borderRadius: "50%",
              textAlign: "center",
              lineHeight: "28px",
              marginRight: "10px",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            1
          </span>
          Improve ChessorTag imitator's logic, so it better imitates players' styles
        </li>
        <li style={{ marginBottom: "18px" }}>
          <span
            style={{
              display: "inline-block",
              width: "28px",
              height: "28px",
              background: "#8b7355",
              color: "white",
              borderRadius: "50%",
              textAlign: "center",
              lineHeight: "28px",
              marginRight: "10px",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            2
          </span>
          Hold <strong>HIGH FUNDS TOURNAMENTS</strong> (see steinitzchess.org). Encourage
          up-and-coming players to improve
        </li>
        <li style={{ marginBottom: "18px" }}>
          <span
            style={{
              display: "inline-block",
              width: "28px",
              height: "28px",
              background: "#8b7355",
              color: "white",
              borderRadius: "50%",
              textAlign: "center",
              lineHeight: "28px",
              marginRight: "10px",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            3
          </span>
          <strong>Advertising!</strong> Ask PRO players to use and comment on our product, so
          more people can know this
        </li>
        <li style={{ marginBottom: "18px" }}>
          <span
            style={{
              display: "inline-block",
              width: "28px",
              height: "28px",
              background: "#8b7355",
              color: "white",
              borderRadius: "50%",
              textAlign: "center",
              lineHeight: "28px",
              marginRight: "10px",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            4
          </span>
          <span style={{ textDecoration: "line-through" }}>
            Buy bubble tea and Clash Royale boarding pass
          </span>
        </li>
      </ul>
    </div>
  );
};

export default FundingPlansSection;
