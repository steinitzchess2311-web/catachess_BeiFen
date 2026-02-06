import React from "react";

const UserManual = () => {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: "20px",
        border: "1px solid rgba(26, 27, 31, 0.12)",
        background: "rgba(255, 255, 255, 0.75)",
        boxShadow: "0 16px 36px rgba(28, 23, 18, 0.1)",
        padding: "24px 28px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#9b3f1e",
          fontWeight: 600,
        }}
      >
        User Manual
      </div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: "#2f2a26" }}>
        How to use ChessorTag.org
      </div>
      <div style={{ fontSize: "15px", lineHeight: 1.75, color: "#2f2a26" }}>
        This is a detailed tutorial on how to use ChessorTag.org. After you created an
        account and sign in, you can choose to create a folder or a study. After you
        opened the study, you will be able to create a list of chapters on the right.
        In each chapter, you can click on “analysis” to see how the engine evaluates
        the position. You can also click on “imitator”, our central innovation, to
        select your coach from a list of tagged grandmasters. It usually takes about
        20 seconds waiting for the results. You will see the list of possible moves
        the selected coach will make according to their past style. You can also click
        “generate coach note” to view the humanized commentary provided by the coach,
        instructing you on how to evaluate on the position and why they made a
        particular move.
      </div>
    </div>
  );
};

export default UserManual;
