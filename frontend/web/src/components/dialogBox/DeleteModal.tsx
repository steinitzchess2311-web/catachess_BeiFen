import React, { useState, useRef, useEffect } from 'react';
import { api } from '@ui/assets/api';
import './DeleteModal.css';

interface DeleteModalProps {
  node: {
    id: string;
    title: string;
    node_type: 'folder' | 'study';
    version: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ node, onClose, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Handle delete with retry logic for version conflicts
  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      // First attempt
      await api.delete(`/api/v1/workspace/nodes/${node.id}/purge?version=${node.version}`);

      onSuccess();
    } catch (error: any) {
      // Handle version conflict (409) with retry
      if (error?.status === 409) {
        console.log('[DeleteModal] Version conflict detected, refreshing and retrying...');

        try {
          // Fetch latest version
          const refreshed = await api.get(`/api/v1/workspace/nodes/${node.id}`);

          // Retry with new version
          await api.delete(`/api/v1/workspace/nodes/${refreshed.id}/purge?version=${refreshed.version}`);

          console.log('[DeleteModal] Delete succeeded after version refresh');
          onSuccess();
        } catch (retryError: any) {
          console.error('[DeleteModal] Failed to delete after retry:', retryError);
          setError('Delete failed. Please try again.');
          setIsDeleting(false);
        }
      } else {
        console.error('[DeleteModal] Failed to delete:', error);
        setError(error?.message || 'Delete failed. Please try again.');
        setIsDeleting(false);
      }
    }
  };

  const icon = node.node_type === 'folder' ? '📁' : '📖';
  const typeLabel = node.node_type === 'folder' ? 'Folder' : 'Study';

  return (
    <div className="delete-modal-overlay">
      <div ref={modalRef} className="delete-modal-card">
        <div className="delete-modal-header">
          <h3 className="delete-modal-title">
            🗑️ Delete
          </h3>
          <button className="delete-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="delete-modal-body">
          <div className="delete-modal-warning">
            <p className="delete-modal-message">
              Are you sure you want to delete this {typeLabel.toLowerCase()}?
            </p>
            <div className="delete-modal-node-info">
              {icon} <strong>{node.title}</strong>
            </div>
            <p className="delete-modal-hint">
              This action cannot be undone.
            </p>
          </div>
          {error && (
            <div className="delete-modal-error">
              {error}
            </div>
          )}
        </div>

        <div className="delete-modal-footer">
          <button
            className="delete-modal-btn delete-modal-btn-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="delete-modal-btn delete-modal-btn-delete"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
