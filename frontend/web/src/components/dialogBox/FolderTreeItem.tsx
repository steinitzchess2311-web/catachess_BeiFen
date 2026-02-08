import React, { useState } from 'react';
import { FolderNode, fetchFolders } from '../../utils/folderTree';

interface FolderTreeItemProps {
  folder: FolderNode;
  level: number;
  expandedFolders: Set<string>;
  onToggleExpand: (folderId: string) => void;
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
  expandedFolders,
  onToggleExpand,
  onSelectFolder,
}) => {
  const [children, setChildren] = useState<FolderNode[]>([]);
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const isExpanded = expandedFolders.has(folder.id);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Always toggle first
    onToggleExpand(folder.id);

    // Load children if not loaded yet and we're expanding
    if (!childrenLoaded && !isExpanded) {
      try {
        const folders = await fetchFolders(folder.id, folder.path);
        setChildren(folders);
        setChildrenLoaded(true);
      } catch (error) {
        console.error('Failed to load folders:', error);
      }
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectFolder(folder);
  };

  // Only show expand icon if not yet loaded or has children
  const showExpandIcon = !childrenLoaded || children.length > 0;

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
      {isExpanded && (
        <div className="folder-children">
          {!childrenLoaded ? (
            <div className="folder-loading" style={{ paddingLeft: `${(level + 1) * 20}px` }}>
              Loading...
            </div>
          ) : (
            children.map((child) => (
              <FolderTreeItem
                key={child.id}
                folder={child}
                level={level + 1}
                expandedFolders={expandedFolders}
                onToggleExpand={onToggleExpand}
                onSelectFolder={onSelectFolder}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FolderTreeItem;
