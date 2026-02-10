/**
 * SearchSection component - Article search functionality
 */

import React from "react";
import { SearchSectionProps } from "./types";

const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  setSearchQuery,
  handleSearchClear,
}) => {
  return (
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
  );
};

export default SearchSection;
