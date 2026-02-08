import { api } from '@ui/assets/api';

export interface FolderNode {
  id: string;
  title: string;
  path: string;
  parent_id: string | null;
  hasChildren: boolean;
  children?: FolderNode[];
}

/**
 * Fetch all folders under a parent folder
 */
export async function fetchFolders(parentId: string, parentPath: string = 'root'): Promise<FolderNode[]> {
  try {
    const response = await api.get(`/api/v1/workspace/nodes?parent_id=${parentId}`);
    const nodes = response.nodes || [];

    // Filter only folders
    return nodes
      .filter((node: any) => node.node_type === 'folder')
      .map((node: any) => ({
        id: node.id,
        title: node.title,
        path: parentPath === 'root' ? `root/${node.title}` : `${parentPath}/${node.title}`,
        parent_id: node.parent_id,
        hasChildren: true, // Assume all folders may have children
      }));
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    return [];
  }
}

/**
 * Filter folders by exact prefix match
 * Example: input "cata" matches "cata" and "catalan", but not "bata"
 */
export function filterByPrefix(folders: FolderNode[], prefix: string): FolderNode[] {
  if (!prefix) return folders;

  const lowerPrefix = prefix.toLowerCase();

  return folders
    .filter(folder => folder.title.toLowerCase().startsWith(lowerPrefix))
    .sort((a, b) => {
      // Exact match comes first
      const aExact = a.title.toLowerCase() === lowerPrefix;
      const bExact = b.title.toLowerCase() === lowerPrefix;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Alphabetical order
      return a.title.localeCompare(b.title);
    });
}

/**
 * Resolve path string to folder ID
 * Example: "root/folder1/folder2" -> folder2's ID
 */
export async function resolvePathToId(path: string): Promise<string | null> {
  try {
    const cleaned = path.trim();
    if (!cleaned) return null;

    const parts = cleaned.split('/').filter(Boolean);
    if (parts.length === 0 || parts[0] !== 'root') {
      return null;
    }

    if (parts.length === 1) {
      return 'root';
    }

    let parentId = 'root';
    for (let i = 1; i < parts.length; i++) {
      const segment = parts[i];
      const response = await api.get(`/api/v1/workspace/nodes?parent_id=${parentId}`);
      const nodes = response.nodes || [];
      const match = nodes.find((node: any) =>
        node.title === segment && node.node_type === 'folder'
      );

      if (!match) {
        return null;
      }

      parentId = match.id;
    }

    return parentId;
  } catch (error) {
    console.error('Failed to resolve path:', error);
    return null;
  }
}
