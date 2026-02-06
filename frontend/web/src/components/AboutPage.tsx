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
      <h1>About Catachess</h1>
      <p>Catachess is a platform for chess education and improvement, inspired by the clean and functional design principles of Google.</p>
      <p>Our mission is to provide an intuitive and powerful set of tools for players of all levels to analyze their games, learn from their mistakes, and discover new ideas.</p>
    </div>
  );
};

export default AboutPage;
