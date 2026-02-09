import React from "react";

const ContentArea = () => {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255, 255, 255, 0.85)",
        borderRadius: "12px",
        padding: "40px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        minHeight: "600px",
      }}
    >
      {/* Placeholder Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "500px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "4rem",
            marginBottom: "20px",
            opacity: 0.3,
          }}
        >
          📝
        </div>
        <h2
          style={{
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#2c2c2c",
            marginBottom: "12px",
          }}
        >
          Coming Soon
        </h2>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#5a5a5a",
            maxWidth: "500px",
            lineHeight: "1.6",
          }}
        >
          We're working hard to bring you insightful articles about chess
          strategies, platform features, and community stories. Stay tuned!
        </p>

        {/* Decorative Elements */}
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            gap: "20px",
          }}
        >
          {["Opening Analysis", "Platform Tips", "Player Stories"].map(
            (topic, index) => (
              <div
                key={index}
                style={{
                  padding: "10px 20px",
                  background: "rgba(139, 115, 85, 0.1)",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  color: "#8b7355",
                  fontWeight: 600,
                }}
              >
                {topic}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentArea;
