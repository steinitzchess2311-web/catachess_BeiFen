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
        }}
      />
    </div>
  );
};

export default AboutPage;
