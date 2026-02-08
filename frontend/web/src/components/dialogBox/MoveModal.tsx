import React, { useState, useEffect, useRef } from 'react';
import FolderTree from './FolderTree';
import { FolderNode, fetchFolders, resolvePathToId } from '../../utils/folderTree';
import { api } from '@ui/assets/api';
import './MoveModal.css';

interface MoveModalProps {
  node: {
    id: string;
    title: string;
    node_type: 'folder' | 'study';
    version: number;
    parent_id: string | null;
    path?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const MoveModal: React.FC<MoveModalProps> = ({ node, onClose, onSuccess }) => {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [rootFolders, setRootFolders] = useState<FolderNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isMoving, setIsMoving] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load root folders on mount
  useEffect(() => {
    fetchFolders('root', 'root').then(setRootFolders);
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

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Check if clicking inside dropdown
    if (modalRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    // Delay to allow click events to fire
    setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  const handleSelectFolder = (folder: FolderNode) => {
    setInputValue(folder.path);
    setIsDropdownOpen(false);
    inputRef.current?.blur();
  };

  const handleToggleExpand = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleMove = async () => {
    if (!inputValue.trim()) {
      alert('Please select a destination folder');
      return;
    }

    setIsMoving(true);

    try {
      const targetFolderId = await resolvePathToId(inputValue);

      if (!targetFolderId) {
        alert('Invalid path. Please select a valid folder.');
        setIsMoving(false);
        return;
      }

      // Prevent moving folder into itself or its descendants
      if (node.node_type === 'folder' && node.path && inputValue.startsWith(node.path)) {
        alert('Cannot move a folder into itself or its descendants');
        setIsMoving(false);
        return;
      }

      await api.post(`/api/v1/workspace/nodes/${node.id}/move`, {
        new_parent_id: targetFolderId === 'root' ? null : targetFolderId,
        version: node.version,
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to move node:', error);
      alert('Move failed. Please try again.');
      setIsMoving(false);
    }
  };

  // Extract search term from input (last segment after /)
  const getSearchTerm = () => {
    const parts = inputValue.split('/').filter(Boolean);
    if (parts.length <= 1) return '';
    return parts[parts.length - 1];
  };

  return (
    <div className="move-modal-overlay">
      <div ref={modalRef} className="move-modal-card">
        <div className="move-modal-header">
          <h3 className="move-modal-title">Move To</h3>
          <button className="move-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="move-modal-body">
          <label className="move-modal-label">Destination</label>
          <input
            ref={inputRef}
            type="text"
            className="move-modal-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="root/..."
          />

          {isDropdownOpen && (
            <div className="folder-dropdown">
              <FolderTree
                folders={rootFolders}
                expandedFolders={expandedFolders}
                onToggleExpand={handleToggleExpand}
                onSelectFolder={handleSelectFolder}
                filterText={getSearchTerm()}
              />
            </div>
          )}
        </div>

        <div className="move-modal-footer">
          <button
            className="move-modal-btn move-modal-btn-cancel"
            onClick={onClose}
            disabled={isMoving}
          >
            Cancel
          </button>
          <button
            className="move-modal-btn move-modal-btn-move"
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

export default MoveModal;
