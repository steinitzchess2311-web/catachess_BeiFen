import React, { useState } from "react";

const FoundersSection = () => {
  const [shakeLeft, setShakeLeft] = useState(false);
  const [shakeRight, setShakeRight] = useState(false);

  const handleLeftClick = () => {
    setShakeLeft(true);
    setTimeout(() => setShakeLeft(false), 500);
  };

  const handleRightClick = () => {
    setShakeRight(true);
    setTimeout(() => setShakeRight(false), 500);
  };

  return (
    <>
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
        `}
      </style>
      <div
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        borderRadius: "12px",
        padding: "32px",
        marginBottom: "45px",
        boxShadow: "0 4px 20px rgba(139, 115, 85, 0.08)",
        border: "1px solid rgba(139, 115, 85, 0.15)",
        display: "flex",
        gap: "32px",
        alignItems: "center",
      }}
    >
      <div style={{ flex: "1" }}>
        <p
          style={{
            fontSize: "1.05rem",
            lineHeight: "1.9",
            color: "#4a4a4a",
            marginBottom: "0",
          }}
        >
          This website is actually started and <strong>FULLY developed</strong> by 2 high
          school students: <strong style={{ color: "#8b7355" }}>Quanhao Li (Left)</strong>,{" "}
          <strong style={{ color: "#8b7355" }}>Jorlanda Chen (Right)</strong>. They are young dreamers,
          PRO chess players, and are trying to easier chess players' lives:
        </p>
      </div>
      <div
        style={{
          display: "flex",
          gap: "16px",
          flex: "0 0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <img
            src="/assets/developers/CataDragon.png"
            alt="Quanhao Li (CataDragon)"
            onClick={handleLeftClick}
            style={{
              width: "120px",
              height: "120px",
              objectFit: "cover",
              borderRadius: "8px",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.12)",
              cursor: "pointer",
              animation: shakeLeft ? "shake 0.5s ease-in-out" : "none",
            }}
          />
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#8b7355",
              textAlign: "center",
            }}
          >
            Quanhao Li
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <img
            src="/assets/developers/ChessNut.jpg"
            alt="Jorlanda Chen (ChessNut)"
            onClick={handleRightClick}
            style={{
              width: "120px",
              height: "120px",
              objectFit: "cover",
              borderRadius: "8px",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.12)",
              cursor: "pointer",
              animation: shakeRight ? "shake 0.5s ease-in-out" : "none",
            }}
          />
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#8b7355",
              textAlign: "center",
            }}
          >
            Jorlanda Chen
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default FoundersSection;
