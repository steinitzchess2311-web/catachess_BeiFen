import React, { useState } from "react";

const CategorySidebar = () => {
  const [activeCategory, setActiveCategory] = useState<string>("pinned");

  const categories = [
    { id: "pinned", label: "📌 Pinned Articles", icon: "📌" },
    { id: "about", label: "👋 About Us", icon: "👋" },
    { id: "function", label: "⚡ Function Intro", icon: "⚡" },
    { id: "chess", label: "♟️ Chess Topic", icon: "♟️" },
  ];

  return (
    <div
      style={{
        width: "280px",
        flexShrink: 0,
        background: "rgba(255, 255, 255, 0.85)",
        borderRadius: "12px",
        padding: "25px 0",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        position: "sticky",
        top: "100px",
      }}
    >
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "#2c2c2c",
          marginBottom: "20px",
          paddingLeft: "25px",
          paddingRight: "25px",
          letterSpacing: "0.5px",
        }}
      >
        CATEGORIES
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            style={{
              background:
                activeCategory === category.id
                  ? "linear-gradient(90deg, rgba(139, 115, 85, 0.15) 0%, rgba(139, 115, 85, 0.05) 100%)"
                  : "transparent",
              border: "none",
              borderLeft:
                activeCategory === category.id
                  ? "4px solid #8b7355"
                  : "4px solid transparent",
              padding: "14px 25px",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: activeCategory === category.id ? 600 : 500,
              color: activeCategory === category.id ? "#2c2c2c" : "#5a5a5a",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
            onMouseEnter={(e) => {
              if (activeCategory !== category.id) {
                e.currentTarget.style.background =
                  "rgba(139, 115, 85, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== category.id) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>{category.icon}</span>
            <span>{category.label.replace(/^[^\s]+ /, "")}</span>
          </button>
        ))}
      </div>

      {/* Stats Section */}
      <div
        style={{
          marginTop: "30px",
          paddingTop: "20px",
          borderTop: "1px solid rgba(139, 115, 85, 0.15)",
          paddingLeft: "25px",
          paddingRight: "25px",
        }}
      >
        <div
          style={{
            fontSize: "0.85rem",
            color: "#8b7355",
            fontWeight: 600,
            marginBottom: "10px",
          }}
        >
          BLOG STATS
        </div>
        <div
          style={{
            fontSize: "0.9rem",
            color: "#5a5a5a",
            lineHeight: "1.8",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Total Articles:</span>
            <strong style={{ color: "#8b7355" }}>0</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>This Month:</span>
            <strong style={{ color: "#8b7355" }}>0</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;
