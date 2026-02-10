/**
 * ArticleImage component - Cover image with category and pinned badges
 */

import React from "react";
import { ArticleImageProps, CATEGORY_LABELS } from "./types";
import logoImage from "../../../assets/logo.jpg";

const ArticleImage: React.FC<ArticleImageProps> = ({
  imageUrl,
  title,
  category,
  isPinned,
}) => {
  const displayImage = imageUrl || logoImage;

  return (
    <div
      style={{
        width: "100%",
        height: "200px",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#f5f5f5",
      }}
    >
      <img
        src={displayImage}
        alt={title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      />

      {/* Category Badge */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "rgba(139, 115, 85, 0.9)",
          color: "white",
          padding: "6px 14px",
          borderRadius: "6px",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        {CATEGORY_LABELS[category] || category}
      </div>

      {/* Pinned Badge */}
      {isPinned && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(255, 193, 7, 0.9)",
            color: "white",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          📌 Pinned
        </div>
      )}
    </div>
  );
};

export default ArticleImage;
