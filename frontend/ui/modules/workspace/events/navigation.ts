// Navigation and path management

import { api } from '../../../assets/api';
import { WorkspaceState, WorkspaceElements } from './types';

export function getPathPrefix(state: WorkspaceState) {
    const segments = state.breadcrumbPath
        .map((item) => item.title)
        .filter((_, idx) => idx > 0);
    if (segments.length === 0) return 'root/';
    return `root/${segments.join('/')}/`;
}

export function updatePathInputDisplay(state: WorkspaceState, elements: WorkspaceElements) {
    if (!elements.pathInput) return;
    const prefix = getPathPrefix(state);
    elements.pathInput.value = `${prefix}...`;
}

export function renderBreadcrumb(state: WorkspaceState, elements: WorkspaceElements, navigateToFolder: (id: string, title: string) => Promise<void>) {
    elements.breadcrumb.innerHTML = '';
    state.breadcrumbPath.forEach((p) => {
        const span = document.createElement('span');
        span.className = 'breadcrumb-item';
        span.textContent = p.title;
        span.addEventListener('click', () => navigateToFolder(p.id, p.title));
        elements.breadcrumb.appendChild(span);
    });
}

export async function navigateToFolder(
    state: WorkspaceState,
    elements: WorkspaceElements,
    id: string,
    title: string,
    refreshNodes: (parentId: string) => Promise<void>
) {
    state.currentParentId = id;
    // Update breadcrumb
    if (id === 'root') {
        state.breadcrumbPath = [{id: 'root', title: 'Root'}];
    } else {
        // Simple logic: if exists in path, truncate, else append
        const index = state.breadcrumbPath.findIndex(p => p.id === id);
        if (index !== -1) {
            state.breadcrumbPath = state.breadcrumbPath.slice(0, index + 1);
        } else {
            state.breadcrumbPath.push({id, title});
        }
    }
    renderBreadcrumb(state, elements, (id, title) => navigateToFolder(state, elements, id, title, refreshNodes));
    await refreshNodes(id);
    updatePathInputDisplay(state, elements);
}

export function shakePathInput(elements: WorkspaceElements) {
    if (!elements.pathInput) return;
    elements.pathInput.classList.remove('path-input-shake');
    // Trigger reflow to restart animation
    void elements.pathInput.offsetWidth;
    elements.pathInput.classList.add('path-input-shake');
}

export async function resolvePath(
    state: WorkspaceState,
    elements: WorkspaceElements,
    rawPath: string,
    options: { onOpenStudy?: (studyId: string) => void },
    navigateToFolder: (id: string, title: string) => Promise<void>
) {
    let cleaned = rawPath.trim().replace(/\/+/g, '/');
    if (cleaned.endsWith('/...')) {
        cleaned = cleaned.slice(0, -4);
    }
    if (cleaned.endsWith('/') && cleaned !== 'root/') {
        cleaned = cleaned.slice(0, -1);
    }
    if (!cleaned) return;
    const parts = cleaned.split('/').filter(Boolean);
    if (parts.length === 0 || parts[0] !== 'root') {
        shakePathInput(elements);
        return;
    }
    if (parts.length === 1) {
        navigateToFolder('root', 'Root');
        return;
    }

    let parentId = 'root';
    for (let i = 1; i < parts.length; i += 1) {
        const segment = parts[i];
        const isLast = i === parts.length - 1;
        const wantsStudy = isLast && segment.endsWith('.study');
        const name = wantsStudy ? segment.slice(0, -6) : segment;
        if (!name) {
            shakePathInput(elements);
            return;
        }

        const response = await api.get(`/api/v1/workspace/nodes?parent_id=${parentId}`);
        const nodes = (response?.nodes || []) as any[];
        const match = nodes.find((node) => node.title === name);
        if (!match) {
            shakePathInput(elements);
            return;
        }

        if (!isLast) {
            if (match.node_type !== 'folder') {
                shakePathInput(elements);
                return;
            }
            parentId = match.id;
            continue;
        }

        if (wantsStudy) {
            if (match.node_type !== 'study') {
                shakePathInput(elements);
                return;
            }
            if (options.onOpenStudy) {
                options.onOpenStudy(match.id);
            } else {
                window.location.assign(`/workspace/${match.id}`);
            }
            return;
        }

        if (match.node_type !== 'folder') {
            shakePathInput(elements);
            return;
        }
        navigateToFolder(match.id, match.title);
        return;
    }
}

export async function fetchFolderOptions() {
    const folders: Array<{ id: string; label: string; path: string }> = [];
    const walk = async (parentId: string, prefix: string) => {
        const response = await api.get(`/api/v1/workspace/nodes?parent_id=${parentId}`);
        const nodes = response.nodes as any[];
        const sorted = nodes.filter(n => n.node_type === 'folder');
        for (const node of sorted) {
            const label = prefix ? `${prefix} / ${node.title}` : node.title;
            folders.push({ id: node.id, label, path: node.path });
            await walk(node.id, label);
        }
    };
    await walk('root', 'Root');
    return [{ id: 'root', label: 'Root', path: '/root/' }, ...folders];
}
