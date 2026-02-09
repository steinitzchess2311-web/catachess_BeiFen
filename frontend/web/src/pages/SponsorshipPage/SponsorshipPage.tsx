import React from "react";

const SponsorshipPage = () => {
  return (
    <div
      style={{
        padding: "28px 24px 40px",
        fontFamily: "'Roboto', sans-serif",
        background:
          "radial-gradient(circle at top, rgba(250, 246, 242, 0.9) 0%, rgba(240, 230, 218, 0.9) 45%, rgba(233, 220, 207, 0.9) 100%)",
        maxHeight: "calc(100vh - 64px)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#333",
            marginBottom: "1rem",
          }}
        >
          Sponsorship
        </h1>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.8)",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: "1.8",
              color: "#555",
              marginBottom: "1.5rem",
            }}
          >
            Support the development of CataChess and help us continue providing
            free chess training tools for players around the world.
          </p>

          <h2
            style={{
              fontSize: "1.8rem",
              fontWeight: 600,
              color: "#444",
              marginTop: "2rem",
              marginBottom: "1rem",
            }}
          >
            Why Sponsor?
          </h2>

          <ul
            style={{
              fontSize: "1rem",
              lineHeight: "1.8",
              color: "#555",
              paddingLeft: "1.5rem",
            }}
          >
            <li>Help maintain and improve the platform</li>
            <li>Support development of new features</li>
            <li>Keep the service free for all users</li>
            <li>Contribute to the chess community</li>
          </ul>

          <div
            style={{
              marginTop: "2rem",
              padding: "20px",
              background: "rgba(255, 165, 0, 0.1)",
              borderRadius: "8px",
              borderLeft: "4px solid #ff8c00",
            }}
          >
            <p
              style={{
                fontSize: "1rem",
                color: "#666",
                margin: 0,
              }}
            >
              More information about sponsorship options coming soon. Contact us
              at <strong>info@steinitzchess.org</strong> for inquiries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorshipPage;
