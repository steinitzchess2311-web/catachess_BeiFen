import React, { useRef, useEffect } from 'react';
import './NodeActionsModal.css';

interface NodeActionsModalProps {
  node: {
    id: string;
    title: string;
    node_type: 'folder' | 'study';
    version: number;
    parent_id: string | null;
  };
  onClose: () => void;
  onMove: (node: any) => void;
  onRename: (node: any) => void;
  onDelete: (node: any) => void;
}

const NodeActionsModal: React.FC<NodeActionsModalProps> = ({
  node,
  onClose,
  onMove,
  onRename,
  onDelete,
}) => {
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

  const handleAction = (action: 'move' | 'rename' | 'delete') => {
    if (action === 'move') onMove(node);
    if (action === 'rename') onRename(node);
    if (action === 'delete') onDelete(node);
  };

  const icon = node.node_type === 'folder' ? '📁' : '📖';
  const typeLabel = node.node_type === 'folder' ? 'FOLDER' : 'STUDY';

  return (
    <div className="node-actions-overlay">
      <div ref={modalRef} className="node-actions-card">
        <div className="node-actions-header">
          <div className="node-actions-title-group">
            <span className="node-actions-eyebrow">
              {icon} {typeLabel}
            </span>
            <h3 className="node-actions-title">{node.title}</h3>
          </div>
          <button className="node-actions-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="node-actions-body">
          <button
            className="node-action-btn"
            onClick={() => handleAction('move')}
          >
            <span className="action-icon">📦</span>
            <span className="action-label">Move</span>
          </button>
          <button
            className="node-action-btn"
            onClick={() => handleAction('rename')}
          >
            <span className="action-icon">✏️</span>
            <span className="action-label">Rename</span>
          </button>
          <button
            className="node-action-btn node-action-btn-danger"
            onClick={() => handleAction('delete')}
          >
            <span className="action-icon">🗑️</span>
            <span className="action-label">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeActionsModal;
