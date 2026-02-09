import React, { useState, useRef, useEffect } from 'react';
import { api } from '@ui/assets/api';
import './DragMoveModal.css';

interface DragMoveModalProps {
  sourceNode: {
    id: string;
    title: string;
    node_type: 'folder' | 'study';
    version: number;
  };
  targetNode: {
    id: string;
    title: string;
    node_type: 'folder' | 'study';
  };
  onClose: () => void;
  onSuccess: () => void;
}

const DragMoveModal: React.FC<DragMoveModalProps> = ({ sourceNode, targetNode, onClose, onSuccess }) => {
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle move
  const handleMove = async () => {
    setIsMoving(true);
    setError('');

    try {
      await api.post(`/api/v1/workspace/nodes/${sourceNode.id}/move`, {
        new_parent_id: targetNode.id,
        version: sourceNode.version,
      });

      onSuccess();
    } catch (error: any) {
      console.error('[DragMoveModal] Failed to move:', error);
      setError(error?.message || 'Move failed. Please try again.');
      setIsMoving(false);
    }
  };

  const sourceIcon = sourceNode.node_type === 'folder' ? '📁' : '📖';
  const targetIcon = '📁'; // Target is always a folder

  return (
    <div className="drag-move-modal-overlay">
      <div ref={modalRef} className="drag-move-modal-card">
        <div className="drag-move-modal-header">
          <h3 className="drag-move-modal-title">
            📦 Move Item
          </h3>
          <button className="drag-move-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="drag-move-modal-body">
          <div className="drag-move-modal-confirmation">
            <p className="drag-move-modal-message">
              Are you sure you want to move
            </p>
            <div className="drag-move-modal-node-info">
              {sourceIcon} <strong>{sourceNode.title}</strong>
            </div>
            <p className="drag-move-modal-message">
              to
            </p>
            <div className="drag-move-modal-node-info">
              {targetIcon} <strong>{targetNode.title}</strong>
            </p>
          </div>
          {error && (
            <div className="drag-move-modal-error">
              {error}
            </div>
          )}
        </div>

        <div className="drag-move-modal-footer">
          <button
            className="drag-move-modal-btn drag-move-modal-btn-cancel"
            onClick={onClose}
            disabled={isMoving}
          >
            Cancel
          </button>
          <button
            className="drag-move-modal-btn drag-move-modal-btn-confirm"
            onClick={handleMove}
            disabled={isMoving}
          >
            {isMoving ? 'Moving...' : 'Move'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DragMoveModal;
