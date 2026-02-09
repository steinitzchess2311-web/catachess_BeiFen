import React, { useState } from "react";

const CategorySidebar = () => {
  const [activeCategory, setActiveCategory] = useState<string>("pinned");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "pinned", label: "📌 Pinned Articles", icon: "📌" },
    { id: "about", label: "👋 About Us", icon: "👋" },
    { id: "function", label: "⚡ Function Intro", icon: "⚡" },
    { id: "chess", label: "♟️ Chess Topic", icon: "♟️" },
  ];

  const handleSearchClear = () => {
    setSearchQuery("");
  };

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

      {/* Search Section */}
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
            position: "relative",
            width: "100%",
          }}
        >
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 32px 8px 12px",
              border: "1px solid rgba(139, 115, 85, 0.3)",
              borderRadius: "6px",
              fontSize: "0.9rem",
              color: "#2c2c2c",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              boxSizing: "border-box",
              transition: "all 0.2s ease",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#8b7355";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(139, 115, 85, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(139, 115, 85, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {searchQuery && (
            <button
              onClick={handleSearchClear}
              style={{
                position: "absolute",
                top: "50%",
                right: "8px",
                transform: "translateY(-50%)",
                width: "20px",
                height: "20px",
                border: "none",
                background: "rgba(139, 115, 85, 0.2)",
                borderRadius: "50%",
                fontSize: "14px",
                lineHeight: "1",
                color: "#5a5a5a",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(139, 115, 85, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(139, 115, 85, 0.2)";
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;
