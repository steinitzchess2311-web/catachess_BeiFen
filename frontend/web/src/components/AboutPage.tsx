import React from 'react';

const AboutPage = () => {
  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "'Roboto', sans-serif",
        // Keep content scrollable beneath the fixed header.
        maxHeight: "calc(100vh - 64px)",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          height: "200px",
          width: "100%",
          border: "2px solid #000",
          marginBottom: "20px",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "20px", fontWeight: 600 }}>
          About ChessorTag
        </div>
        <div style={{ fontSize: "16px", lineHeight: 1.6 }}>
          ChessorTag is a platform that offers:
        </div>
        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "16px", lineHeight: 1.6 }}>
          <li>
            A detailed report based on your uploaded games, highlighting your weaknesses,
            strengths, and areas of improvement
          </li>
          <li>
            A virtual coach selection of your choice. Players can choose a grandmaster profile
            and learn what move the grandmaster is likely to make in a position. The virtual
            coach can also generate humanized commentary for its choice of move.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AboutPage;
