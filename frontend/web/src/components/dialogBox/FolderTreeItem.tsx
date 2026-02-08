import React, { useState } from 'react';
import { FolderNode, fetchFolders } from '../../utils/folderTree';

interface FolderTreeItemProps {
  folder: FolderNode;
  level: number;
  onSelectFolder: (folder: FolderNode) => void;
}

const FolderIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" style={{ flexShrink: 0 }}>
    <path
      fill="#1A73E8"
      d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
    />
  </svg>
);

const FolderTreeItem: React.FC<FolderTreeItemProps> = ({
  folder,
  level,
  onSelectFolder,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FolderNode[]>([]);
  const [childrenLoaded, setChildrenLoaded] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If not loaded yet, load first
    if (!childrenLoaded) {
      console.log('[FolderTree] Loading children for:', folder.title, folder.id);
      try {
        const folders = await fetchFolders(folder.id, folder.path);
        console.log('[FolderTree] Loaded', folders.length, 'folders:', folders);
        setChildren(folders);
        setChildrenLoaded(true);
        // Expand after loading
        setIsExpanded(true);
      } catch (error) {
        console.error('[FolderTree] Failed to load folders:', error);
      }
    } else {
      // Already loaded, just toggle
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectFolder(folder);
  };

  // Only show expand icon if not yet loaded or has children
  const showExpandIcon = !childrenLoaded || children.length > 0;

  console.log('[FolderTreeItem]', folder.title, '| isExpanded:', isExpanded, '| childrenLoaded:', childrenLoaded, '| children.length:', children.length);

  return (
    <div className="folder-tree-item">
      <div
        className="folder-tree-row"
        style={{ paddingLeft: `${level * 20}px` }}
      >
        {/* Expand/collapse arrow */}
        {showExpandIcon && (
          <span className="expand-icon" onClick={handleToggle}>
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!showExpandIcon && <span className="expand-icon-placeholder" />}

        {/* Folder icon */}
        <FolderIcon />

        {/* Folder name */}
        <span className="folder-name" onClick={handleSelect}>
          {folder.title}
        </span>
      </div>

      {/* Children */}
      {isExpanded && (() => {
        console.log('[FolderTreeItem] Rendering children area for', folder.title);
        return (
          <div className="folder-children">
            {!childrenLoaded ? (
              <div className="folder-loading" style={{ paddingLeft: `${(level + 1) * 20}px` }}>
                Loading...
              </div>
            ) : (
              <>
                {(() => {
                  console.log('[FolderTreeItem] Mapping', children.length, 'children for', folder.title);
                  return children.map((child) => (
                    <FolderTreeItem
                      key={child.id}
                      folder={child}
                      level={level + 1}
                      onSelectFolder={onSelectFolder}
                    />
                  ));
                })()}
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default FolderTreeItem;
