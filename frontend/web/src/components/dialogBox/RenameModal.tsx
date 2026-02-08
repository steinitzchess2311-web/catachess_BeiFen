import React, { useState, useRef, useEffect } from 'react';
import { api } from '@ui/assets/api';
import './RenameModal.css';

interface RenameModalProps {
  node: {
    id: string;
    title: string;
    node_type: 'folder' | 'study';
    version: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const RenameModal: React.FC<RenameModalProps> = ({ node, onClose, onSuccess }) => {
  const [inputValue, setInputValue] = useState(node.title);
  const [error, setError] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

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

  // Validate input
  const validate = (): boolean => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setError('Name cannot be empty');
      return false;
    }

    if (trimmed.includes('/')) {
      setError('Name cannot contain "/"');
      return false;
    }

    setError('');
    return true;
  };

  // Handle rename with retry logic for version conflicts
  const handleRename = async () => {
    if (!validate()) return;

    setIsRenaming(true);
    setError('');

    const trimmed = inputValue.trim();

    try {
      // First attempt
      await api.put(`/api/v1/workspace/nodes/${node.id}`, {
        title: trimmed,
        version: node.version,
      });

      onSuccess();
    } catch (error: any) {
      // Handle version conflict (409) with retry
      if (error?.status === 409) {
        console.log('[RenameModal] Version conflict detected, refreshing and retrying...');

        try {
          // Fetch latest version
          const refreshed = await api.get(`/api/v1/workspace/nodes/${node.id}`);

          // Retry with new version
          await api.put(`/api/v1/workspace/nodes/${node.id}`, {
            title: trimmed,
            version: refreshed.version,
          });

          console.log('[RenameModal] Rename succeeded after version refresh');
          onSuccess();
        } catch (retryError: any) {
          console.error('[RenameModal] Failed to rename after retry:', retryError);
          setError('Rename failed. Please try again.');
          setIsRenaming(false);
        }
      } else {
        console.error('[RenameModal] Failed to rename:', error);
        setError(error?.message || 'Rename failed. Please try again.');
        setIsRenaming(false);
      }
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRenaming) {
      handleRename();
    }
  };

  const icon = node.node_type === 'folder' ? '📁' : '📖';
  const typeLabel = node.node_type === 'folder' ? 'Folder' : 'Study';

  return (
    <div className="rename-modal-overlay">
      <div ref={modalRef} className="rename-modal-card">
        <div className="rename-modal-header">
          <h3 className="rename-modal-title">
            Rename {typeLabel}
          </h3>
          <button className="rename-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="rename-modal-body">
          <label className="rename-modal-label">
            {icon} {typeLabel} Name
          </label>
          <input
            ref={inputRef}
            type="text"
            className="rename-modal-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRenaming}
          />
          {error && (
            <div className="rename-modal-error">
              {error}
            </div>
          )}
        </div>

        <div className="rename-modal-footer">
          <button
            className="rename-modal-btn rename-modal-btn-cancel"
            onClick={onClose}
            disabled={isRenaming}
          >
            Cancel
          </button>
          <button
            className="rename-modal-btn rename-modal-btn-rename"
            onClick={handleRename}
            disabled={isRenaming}
          >
            {isRenaming ? 'Renaming...' : 'Rename'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;
