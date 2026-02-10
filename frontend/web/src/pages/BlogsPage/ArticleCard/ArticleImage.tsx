/**
 * ArticleImage component - Cover image with category and pinned badges
 */

import React from "react";
import { TrashIcon, DrawingPinFilledIcon } from "@radix-ui/react-icons";
import { ArticleImageProps, CATEGORY_LABELS } from "./types";
import logoImage from "../../../assets/logo.jpg";

interface ArticleImageWithActionsProps extends ArticleImageProps {
  canDelete?: boolean;
  canPin?: boolean;
  onDeleteClick?: (e: React.MouseEvent) => void;
  onPinToggle?: (e: React.MouseEvent) => void;
}

const ArticleImage: React.FC<ArticleImageWithActionsProps> = ({
  imageUrl,
  title,
  category,
  isPinned,
  canDelete,
  canPin,
  onDeleteClick,
  onPinToggle,
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

      {/* Action Buttons - Top Right */}
      {(canDelete || canPin) && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            display: "flex",
            gap: "8px",
            zIndex: 10,
          }}
        >
          {/* Delete Button */}
          {canDelete && (
            <button
              onClick={onDeleteClick}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                backgroundColor: "rgba(150, 150, 150, 0.5)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                color: "white",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.95)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(150, 150, 150, 0.5)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.95)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
            >
              <TrashIcon width={18} height={18} />
            </button>
          )}

          {/* Pin Button */}
          {canPin && (
            <button
              onClick={onPinToggle}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                backgroundColor: isPinned
                  ? "rgba(255, 193, 7, 0.95)"
                  : "rgba(150, 150, 150, 0.5)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                color: "white",
              }}
              onMouseEnter={(e) => {
                if (!isPinned) {
                  e.currentTarget.style.backgroundColor = "rgba(255, 193, 7, 0.95)";
                }
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                if (!isPinned) {
                  e.currentTarget.style.backgroundColor = "rgba(150, 150, 150, 0.5)";
                }
                e.currentTarget.style.transform = "scale(1)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.95)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
            >
              <DrawingPinFilledIcon width={18} height={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ArticleImage;
