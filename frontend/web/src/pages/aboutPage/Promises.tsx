import React from "react";

const Promises = () => {
  const promises = [
    {
      title: "We promise to be forever FREE to everyone.",
      description:
        "All functions are free for all users. However, donators get bragging rights with cute little pets on your page.",
      icon: "🎁",
    },
    {
      title: "We promise to NEVER force anyone read Ads",
      description:
        "Ads only appears in footer and blog section. Scroll it away anytime you want.",
      icon: "🚫",
    },
    {
      title: "We promise ALL your suggestions will be considered seriously.",
      description:
        "For every email you write for suggestions, we will reply to you within 2 weeks for detailed reasons whether we use it or not.",
      icon: "💡",
    },
  ];

  return (
    <div
      style={{
        marginBottom: "60px",
        padding: "40px 0",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "45px",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "#2c2c2c",
            marginBottom: "16px",
            lineHeight: "1.4",
          }}
        >
          Our Three NOs.
        </h2>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#8b7355",
            fontWeight: 500,
            lineHeight: "1.6",
            maxWidth: "700px",
            margin: "0 auto",
          }}
        >
          These promise last forever since we declare it in our high school time.
        </p>
      </div>

      {/* Promise Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "28px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {promises.map((promise, index) => (
          <div
            key={index}
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "16px",
              padding: "32px 28px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              border: "1px solid rgba(139, 115, 85, 0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(139, 115, 85, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
            }}
          >
            {/* Icon */}
            <div
              style={{
                fontSize: "2.5rem",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              {promise.icon}
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#8b7355",
                marginBottom: "8px",
                lineHeight: "1.4",
                textAlign: "center",
              }}
            >
              {promise.title}
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: "1rem",
                lineHeight: "1.7",
                color: "#5a5a5a",
                margin: "0",
                textAlign: "center",
              }}
            >
              {promise.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Promises;
