/**
 * ActionButtons component - Delete and pin action buttons
 */

import React from "react";
import { ActionButtonsProps } from "./types";

const ActionButtons: React.FC<ActionButtonsProps> = ({
  canDelete,
  canPin,
  isDeleting,
  isPinning,
  isPinned,
  onDeleteClick,
  onPinToggle,
  deleteButtonRef,
  showDeleteConfirm,
  dialogRef,
  onConfirmDelete,
  onCancelDelete,
}) => {
  if (!canDelete && !canPin) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        marginTop: "12px",
        paddingTop: "12px",
        borderTop: "1px solid rgba(139, 115, 85, 0.1)",
        position: "relative",  // For dialog positioning
      }}
    >
      {canDelete && (
        <button
          ref={deleteButtonRef}
          onClick={onDeleteClick}
          disabled={isDeleting}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "0.85rem",
            fontWeight: 500,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: "#dc3545",
            backgroundColor: "transparent",
            border: "2px solid #dc3545",
            borderRadius: "8px",
            cursor: isDeleting ? "not-allowed" : "pointer",
            opacity: isDeleting ? 0.6 : 1,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!isDeleting) {
              e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.1)";
              e.currentTarget.style.transform = "scale(0.97)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseDown={(e) => {
            if (!isDeleting) {
              e.currentTarget.style.transform = "scale(0.95)";
            }
          }}
          onMouseUp={(e) => {
            if (!isDeleting) {
              e.currentTarget.style.transform = "scale(0.97)";
            }
          }}
        >
          {isDeleting ? "Deleting..." : "🗑️ Delete"}
        </button>
      )}
      {canPin && (
        <button
          onClick={onPinToggle}
          disabled={isPinning}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "0.85rem",
            fontWeight: 500,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: isPinned ? "#6c757d" : "#ffc107",
            backgroundColor: "transparent",
            border: `2px solid ${isPinned ? "#6c757d" : "#ffc107"}`,
            borderRadius: "8px",
            cursor: isPinning ? "not-allowed" : "pointer",
            opacity: isPinning ? 0.6 : 1,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!isPinning) {
              e.currentTarget.style.backgroundColor = isPinned
                ? "rgba(108, 117, 125, 0.1)"
                : "rgba(255, 193, 7, 0.1)";
              e.currentTarget.style.transform = "scale(0.97)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseDown={(e) => {
            if (!isPinning) {
              e.currentTarget.style.transform = "scale(0.95)";
            }
          }}
          onMouseUp={(e) => {
            if (!isPinning) {
              e.currentTarget.style.transform = "scale(0.97)";
            }
          }}
        >
          {isPinning
            ? "..."
            : isPinned
            ? "📌 Unpin"
            : "📌 Pin"}
        </button>
      )}

      {/* Delete Confirmation Dialog - Positioned above delete button */}
      {showDeleteConfirm && canDelete && (
        <div
          ref={dialogRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            marginBottom: '8px',
            width: '200px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            padding: '16px',
            zIndex: 1001,
            animation: 'dialogSlideUp 0.2s ease-out',
          }}
        >
          <p
            style={{
              margin: '0 0 16px 0',
              fontSize: '0.9rem',
              color: '#2c2c2c',
              textAlign: 'center',
              lineHeight: '1.4',
            }}
          >
            Delete this article?
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancelDelete();
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '0.85rem',
                fontWeight: 500,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: '#4a9eff',
                backgroundColor: 'transparent',
                border: '2px solid #4a9eff',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(74, 158, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              No
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onConfirmDelete();
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '0.85rem',
                fontWeight: 500,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: '#dc3545',
                backgroundColor: 'transparent',
                border: '2px solid #dc3545',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Yes
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dialogSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ActionButtons;
