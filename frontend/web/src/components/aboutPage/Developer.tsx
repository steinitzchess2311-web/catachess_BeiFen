import React from "react";

const Developer = () => {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        border: "2px solid #000",
        marginBottom: "20px",
        padding: "16px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        alignItems: "center",
        gap: "16px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <img
          src="/assets/developers/CataDragon.png"
          alt="CataDragon"
          style={{ maxWidth: "100%", height: "auto", display: "block" }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img
          src="/assets/developers/ChessNut.jpg"
          alt="ChessNut"
          style={{ maxWidth: "100%", height: "auto", display: "block" }}
        />
      </div>
    </div>
  );
};

export default Developer;
