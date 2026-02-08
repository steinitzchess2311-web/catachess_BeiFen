import React from 'react';
import FolderTreeItem from './FolderTreeItem';
import { FolderNode } from '../../utils/folderTree';

interface FolderTreeProps {
  folders: FolderNode[];
  onSelectFolder: (folder: FolderNode) => void;
  filterText: string;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  onSelectFolder,
  filterText,
}) => {
  // Extract last segment from path for filtering
  const getLastSegment = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  };

  // Filter folders by prefix match
  const filteredFolders = filterText
    ? folders.filter(f => getLastSegment(f.path).toLowerCase().startsWith(filterText.toLowerCase()))
    : folders;

  if (filteredFolders.length === 0) {
    return (
      <div className="folder-tree-empty">
        No folders found
      </div>
    );
  }

  return (
    <div className="folder-tree-list">
      {filteredFolders.map((folder) => (
        <FolderTreeItem
          key={folder.id}
          folder={folder}
          level={0}
          onSelectFolder={onSelectFolder}
        />
      ))}
    </div>
  );
};

export default FolderTree;
