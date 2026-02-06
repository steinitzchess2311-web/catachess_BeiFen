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
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        alignItems: "center",
        gap: "16px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-start", minWidth: 0 }}>
        <img
          src="/assets/developers/CataDragon.png"
          alt="CataDragon"
          loading="eager"
          style={{
            width: "100%",
            maxWidth: "180px",
            height: "auto",
            display: "block",
            objectFit: "contain",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-start", minWidth: 0 }}>
        <img
          src="/assets/developers/ChessNut.jpg"
          alt="ChessNut"
          loading="eager"
          style={{
            width: "100%",
            maxWidth: "180px",
            height: "auto",
            display: "block",
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
};

export default Developer;
