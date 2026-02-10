/**
 * DeleteConfirmDialog component - Inline confirmation dialog for delete action
 * Positioned above the delete button, similar to logout dialog
 */

import React from "react";
import { DeleteConfirmDialogProps } from "./types";

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  show,
  dialogRef,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  return (
    <>
      <div
        ref={dialogRef}
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
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
              onCancel();
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
              onConfirm();
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

      <style>{`
        @keyframes dialogSlideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default DeleteConfirmDialog;
