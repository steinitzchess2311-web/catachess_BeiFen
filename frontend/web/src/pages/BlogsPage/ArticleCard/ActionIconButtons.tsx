/**
 * ActionIconButtons - Modern circular icon buttons for delete and pin actions
 * Positioned in top-right corner of card with hover effects
 */

import React from "react";
import { TrashIcon, DrawingPinFilledIcon } from "@radix-ui/react-icons";

interface ActionIconButtonsProps {
  canDelete: boolean;
  canPin: boolean;
  isPinned: boolean;
  onDeleteClick: (e: React.MouseEvent) => void;
  onPinToggle: (e: React.MouseEvent) => void;
}

const ActionIconButtons: React.FC<ActionIconButtonsProps> = ({
  canDelete,
  canPin,
  isPinned,
  onDeleteClick,
  onPinToggle,
}) => {
  if (!canDelete && !canPin) return null;

  return (
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
            backgroundColor: "rgba(150, 150, 150, 0.3)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            color: "#888",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.9)";
            e.currentTarget.style.color = "white";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(150, 150, 150, 0.3)";
            e.currentTarget.style.color = "#888";
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
              : "rgba(150, 150, 150, 0.3)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            color: isPinned ? "white" : "#888",
          }}
          onMouseEnter={(e) => {
            if (!isPinned) {
              e.currentTarget.style.backgroundColor = "rgba(255, 193, 7, 0.9)";
              e.currentTarget.style.color = "white";
            }
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            if (!isPinned) {
              e.currentTarget.style.backgroundColor = "rgba(150, 150, 150, 0.3)";
              e.currentTarget.style.color = "#888";
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
  );
};

export default ActionIconButtons;
