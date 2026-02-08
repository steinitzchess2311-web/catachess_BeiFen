import React from 'react';
import ReactDOM from 'react-dom/client';
import { api } from '../../../assets/api';
import { makeDraggable } from '../../../core/drag';
import LogoutButton from '../../../../web/src/components/dialogBox/LogoutButton';

type WorkspaceOptions = {
    onOpenStudy?: (studyId: string) => void;
    initialParentId?: string;
};

export async function initWorkspace(container: HTMLElement, options: WorkspaceOptions = {}) {
    // 1. Load Workspace Template
    const template = document.getElementById('workspace-template') as HTMLTemplateElement;
    if (!template) return;
    const content = document.importNode(template.content, true);
    container.appendChild(content);

    // 2. Select Core Elements
    const itemsGrid = container.querySelector('#items-grid') as HTMLElement;
    const breadcrumb = container.querySelector('#breadcrumb') as HTMLElement;
    const folderTree = container.querySelector('#folder-tree') as HTMLElement;
    const newFolderBtn = container.querySelector('#new-folder-btn') as HTMLButtonElement;
    const newStudyBtn = container.querySelector('#new-study-btn') as HTMLButtonElement;
    const pathInput = container.querySelector('#path-input') as HTMLInputElement;
    const searchInput = container.querySelector('#workspace-search-input') as HTMLInputElement;
    const searchClearBtn = container.querySelector('#workspace-search-clear') as HTMLButtonElement;

    // State
    const startParentId = options.initialParentId || 'root';
    let currentParentId = startParentId;
    let breadcrumbPath: Array<{id: string, title: string}> = [{id: 'root', title: 'Root'}];
    let allNodesCache: any[] | null = null;
    let dragNode: any | null = null;

    // 3. Helper Functions

    // Fetch and render nodes for current folder
    const refreshNodes = async (parentId: string) => {
        try {
            // Using the new unified list endpoint
            const response = await api.get(`/api/v1/workspace/nodes?parent_id=${parentId}`);
            renderItems(response.nodes);
        } catch (error) {
            console.error('Failed to fetch nodes:', error);
        }
    };

    const renderItems = (nodes: any[]) => {
        itemsGrid.innerHTML = '';
        const folderTpl = document.getElementById('folder-item-template') as HTMLTemplateElement;
        const studyTpl = document.getElementById('study-item-template') as HTMLTemplateElement;

        nodes.forEach(node => {
            const tpl = node.node_type === 'folder' ? folderTpl : studyTpl;
            const item = document.importNode(tpl.content, true);
            const itemDiv = item.querySelector('.grid-item') as HTMLElement;
            itemDiv.setAttribute('data-id', node.id);
            itemDiv.setAttribute('data-type', node.node_type);
            itemDiv.setAttribute('data-version', String(node.version));
            itemDiv.setAttribute('data-parent-id', node.parent_id ?? '');
            itemDiv.setAttribute('draggable', 'true');
            itemDiv.querySelector('.item-title')!.textContent = node.title;
            const errorEl = itemDiv.querySelector('.item-error') as HTMLElement;
            
            const date = new Date(node.updated_at).toLocaleDateString();
            itemDiv.querySelector('.item-meta')!.textContent = date;

            itemDiv.addEventListener('click', (event) => {
                if (event.button !== 0) {
                    return;
                }
                const target = event.target as HTMLElement;
                if (target.closest('.item-title') || target.closest('.item-title-input')) {
                    return;
                }
                if (event.detail > 1) {
                    return;
                }
                if (node.node_type === 'folder') {
                    navigateToFolder(node.id, node.title);
                    return;
                }
                if (options.onOpenStudy) {
                    options.onOpenStudy(node.id);
                } else {
                    window.location.assign(`/workspace/${node.id}`);
                }
            });

            itemDiv.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                event.stopPropagation();
                openNodeActions(node);
            });

            const startInlineRename = () => {
                const titleSpan = itemDiv.querySelector('.item-title') as HTMLElement;
                if (!titleSpan) return;
                titleSpan.style.display = 'none';
                const input = document.createElement('input');
                input.className = 'item-title-input';
                input.value = node.title || '';
                titleSpan.parentElement?.insertBefore(input, titleSpan.nextSibling);
                input.focus();
                input.select();
                input.addEventListener('click', (event) => event.stopPropagation());

                let cleanedUp = false;  // Flag to prevent duplicate cleanup

                const cleanup = () => {
                    if (cleanedUp) return;  // Already cleaned up, skip
                    cleanedUp = true;
                    input.remove();
                    titleSpan.style.display = '';
                    errorEl.textContent = '';
                };

                input.addEventListener('keydown', async (event) => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        cleanup();
                        return;
                    }
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        const nextTitle = input.value.trim();
                        if (!nextTitle) {
                            cleanup();
                            return;
                        }
                        if (nextTitle.includes('/')) {
                            errorEl.textContent = 'No "/" in study or folder name';
                            return;
                        }
                        try {
                            await renameNode(node, nextTitle);
                            titleSpan.textContent = node.title;
                            cleanup();
                        } catch (error) {
                            console.error('Failed to rename node:', error);
                            // Show error inline instead of alert, don't cleanup so user can retry
                            errorEl.textContent = 'Rename failed. Press Enter to retry or Esc to cancel.';
                        }
                    }
                });

                input.addEventListener('blur', () => cleanup());
            };

            itemDiv.addEventListener('dblclick', (event) => {
                event.preventDefault();
                event.stopPropagation();
                startInlineRename();
            });

            itemDiv.addEventListener('dragstart', (event) => {
                dragNode = node;
                event.dataTransfer?.setData('text/plain', node.id);
                event.dataTransfer?.setDragImage(itemDiv, 10, 10);
            });

            itemDiv.addEventListener('dragend', () => {
                dragNode = null;
                itemDiv.classList.remove('drag-over');
            });

            itemDiv.addEventListener('dragover', (event) => {
                if (!dragNode) return;
                if (node.node_type !== 'folder') return;
                if (dragNode.id === node.id) return;
                event.preventDefault();
                itemDiv.classList.add('drag-over');
            });

            itemDiv.addEventListener('dragleave', () => {
                itemDiv.classList.remove('drag-over');
            });

            itemDiv.addEventListener('drop', async (event) => {
                if (!dragNode) return;
                itemDiv.classList.remove('drag-over');
                if (node.node_type !== 'folder' || dragNode.id === node.id) {
                    itemDiv.classList.remove('drag-over');
                    const sourceEl = itemsGrid.querySelector(`[data-id="${dragNode.id}"]`) as HTMLElement | null;
                    if (sourceEl) {
                        sourceEl.classList.remove('shake');
                        void sourceEl.offsetWidth;
                        sourceEl.classList.add('shake');
                    }
                    return;
                }
                event.preventDefault();
                openMoveConfirm(dragNode, node);
            });

            itemsGrid.appendChild(item);
        });
    };

    itemsGrid.addEventListener('dragover', (event) => {
        if (!dragNode) return;
        event.preventDefault();
    });


    const navigateToFolder = async (id: string, title: string) => {
        currentParentId = id;
        // Update breadcrumb
        if (id === 'root') {
            breadcrumbPath = [{id: 'root', title: 'Root'}];
        } else {
            // Simple logic: if exists in path, truncate, else append
            const index = breadcrumbPath.findIndex(p => p.id === id);
            if (index !== -1) {
                breadcrumbPath = breadcrumbPath.slice(0, index + 1);
            } else {
                breadcrumbPath.push({id, title});
            }
        }
        renderBreadcrumb();
        await refreshNodes(id);
        updatePathInputDisplay();
    };

    const renderBreadcrumb = () => {
        breadcrumb.innerHTML = '';
        breadcrumbPath.forEach((p, index) => {
            const span = document.createElement('span');
            span.className = 'breadcrumb-item';
            span.textContent = p.title;
            span.addEventListener('click', () => navigateToFolder(p.id, p.title));
            breadcrumb.appendChild(span);
        });
    };

    const getPathPrefix = () => {
        const segments = breadcrumbPath
            .map((item) => item.title)
            .filter((_, idx) => idx > 0);
        if (segments.length === 0) return 'root/';
        return `root/${segments.join('/')}/`;
    };

    const updatePathInputDisplay = () => {
        if (!pathInput) return;
        const prefix = getPathPrefix();
        pathInput.value = `${prefix}...`;
    };

    const fetchAllNodes = async () => {
        if (allNodesCache) return allNodesCache;
        const collected: any[] = [];
        const queue: string[] = ['root'];
        while (queue.length) {
            const parentId = queue.shift() as string;
            const response = await api.get(`/api/v1/workspace/nodes?parent_id=${parentId}`);
            const nodes = (response?.nodes || []) as any[];
            collected.push(...nodes);
            nodes.forEach((node) => {
                if (node.node_type === 'folder') {
                    queue.push(node.id);
                }
            });
        }
        allNodesCache = collected;
        return collected;
    };

    const parseSearch = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const lower = trimmed.toLowerCase();
        if (lower.startsWith('folder/')) {
            return { type: 'folder' as const, query: trimmed.slice(7).trim() };
        }
        if (lower.startsWith('study/')) {
            return { type: 'study' as const, query: trimmed.slice(6).trim() };
        }
        return { type: null, query: trimmed };
    };

    const levenshtein = (a: string, b: string) => {
        const m = a.length;
        const n = b.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i += 1) dp[i][0] = i;
        for (let j = 0; j <= n; j += 1) dp[0][j] = j;
        for (let i = 1; i <= m; i += 1) {
            for (let j = 1; j <= n; j += 1) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost,
                );
            }
        }
        return dp[m][n];
    };

    const scoreMatch = (title: string, query: string) => {
        const t = title.toLowerCase();
        const q = query.toLowerCase();
        if (t === q) return 0;
        if (t.startsWith(q)) return 1;
        const idx = t.indexOf(q);
        if (idx >= 0) return 2 + idx / 100;
        const dist = levenshtein(t, q);
        const norm = dist / Math.max(t.length, q.length, 1);
        return 5 + norm;
    };

    const runSearch = async (raw: string) => {
        const parsed = parseSearch(raw);
        if (!parsed) {
            await refreshNodes(currentParentId);
            return;
        }
        if (!parsed.query) {
            await refreshNodes(currentParentId);
            return;
        }
        const nodes = await fetchAllNodes();
        const filtered = nodes.filter((node) => {
            if (parsed.type && node.node_type !== parsed.type) return false;
            return true;
        });
        const ranked = filtered
            .map((node) => ({
                node,
                score: scoreMatch(node.title || '', parsed.query),
            }))
            .sort((a, b) => a.score - b.score)
            .map((entry) => entry.node);
        renderItems(ranked);
    };

    const shakePathInput = () => {
        if (!pathInput) return;
        pathInput.classList.remove('path-input-shake');
        // Trigger reflow to restart animation
        void pathInput.offsetWidth;
        pathInput.classList.add('path-input-shake');
    };

    const resolvePath = async (rawPath: string) => {
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
            shakePathInput();
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
                shakePathInput();
                return;
            }

            const response = await api.get(`/api/v1/workspace/nodes?parent_id=${parentId}`);
            const nodes = (response?.nodes || []) as any[];
            const match = nodes.find((node) => node.title === name);
            if (!match) {
                shakePathInput();
                return;
            }

            if (!isLast) {
                if (match.node_type !== 'folder') {
                    shakePathInput();
                    return;
                }
                parentId = match.id;
                continue;
            }

            if (wantsStudy) {
                if (match.node_type !== 'study') {
                    shakePathInput();
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
                shakePathInput();
                return;
            }
            navigateToFolder(match.id, match.title);
            return;
        }
    };

    const mountModal = (templateId: string) => {
        const tpl = document.getElementById(templateId) as HTMLTemplateElement;
        const modal = document.importNode(tpl.content, true);
        const overlay = modal.querySelector('.modal-overlay') as HTMLElement;
        const card = overlay.querySelector('.modal-card') as HTMLElement;
        const closeBtns = overlay.querySelectorAll('.modal-close');
        document.body.appendChild(overlay);
        makeDraggable(card, { handle: '.modal-header' });
        const close = () => overlay.remove();
        closeBtns.forEach(btn => btn.addEventListener('click', close));
        return { overlay, close };
    };

    const fetchFolderOptions = async () => {
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
    };

    const openMoveModal = async (node: any) => {
        const { overlay, close } = mountModal('move-node-template');
        const select = overlay.querySelector('#move-destination') as HTMLSelectElement;
        const confirmBtn = overlay.querySelector('#confirm-move') as HTMLButtonElement;
        const optionsList = await fetchFolderOptions();
        optionsList.forEach(option => {
            if (node.node_type === 'folder' && option.path.startsWith(node.path)) {
                return;
            }
            const opt = document.createElement('option');
            opt.value = option.id;
            opt.textContent = option.label;
            select.appendChild(opt);
        });

        confirmBtn.addEventListener('click', async () => {
            const newParentId = select.value === 'root' ? null : select.value;
            try {
                await api.post(`/api/v1/workspace/nodes/${node.id}/move`, {
                    new_parent_id: newParentId,
                    version: node.version,
                });
                close();
                refreshNodes(currentParentId);
            } catch (error) {
                console.error('Failed to move node:', error);
                alert('Move failed');
            }
        });
    };

    const openDeleteConfirm = (node: any) => {
        const { overlay, close } = mountModal('delete-confirm-template');
        const confirmBtn = overlay.querySelector('#confirm-delete') as HTMLButtonElement;
        confirmBtn.addEventListener('click', async () => {
            try {
                await api.delete(`/api/v1/workspace/nodes/${node.id}/purge?version=${node.version}`);
                close();
                allNodesCache = null;
                refreshNodes(currentParentId);
            } catch (error) {
                console.error('Failed to delete node:', error);
                alert('Delete failed');
            }
        });
    };

    const openMoveConfirm = (source: any, target: any) => {
        const { overlay, close } = mountModal('move-confirm-template');
        const textEl = overlay.querySelector('#move-confirm-text') as HTMLElement;
        const confirmBtn = overlay.querySelector('#confirm-move-modal') as HTMLButtonElement;
        textEl.textContent = `Are you sure you want to move\n${source.title} to\n${target.title}?`;

        confirmBtn.addEventListener('click', async () => {
            try {
                await api.post(`/api/v1/workspace/nodes/${source.id}/move`, {
                    new_parent_id: target.id,
                    version: source.version,
                });
                close();
                allNodesCache = null;
                refreshNodes(currentParentId);
            } catch (error) {
                console.error('Failed to move node:', error);
                alert('Move failed');
            }
        });
    };

    const renameNode = async (node: any, title: string) => {
        const trimmed = title.trim();
        if (!trimmed) return false;
        if (trimmed.includes('/')) return false;

        try {
            const response = await api.put(`/api/v1/workspace/nodes/${node.id}`, {
                title: trimmed,
                version: node.version,
            });
            node.title = response.title;
            node.version = response.version;
            allNodesCache = null;
            return true;
        } catch (error: any) {
            // Handle version conflict (409) by fetching latest version and retrying
            if (error.message && error.message.includes('Version conflict')) {
                try {
                    console.log(`[WORKSPACE] Version conflict detected, fetching latest version for node ${node.id}`);
                    const latestNode = await api.get(`/api/v1/workspace/nodes/${node.id}`);
                    const retryResponse = await api.put(`/api/v1/workspace/nodes/${node.id}`, {
                        title: trimmed,
                        version: latestNode.version,
                    });
                    node.title = retryResponse.title;
                    node.version = retryResponse.version;
                    allNodesCache = null;
                    console.log(`[WORKSPACE] ✓ Rename succeeded after version refresh`);
                    return true;
                } catch (retryError) {
                    console.error('Failed to rename node after retry:', retryError);
                    throw retryError;
                }
            }
            throw error;
        }
    };

    const openRenameModal = (node: any) => {
        const { overlay, close } = mountModal('rename-node-template');
        const titleInput = overlay.querySelector('#rename-title') as HTMLInputElement;
        const errorEl = overlay.querySelector('#rename-title-error') as HTMLElement;
        const confirmBtn = overlay.querySelector('#confirm-rename') as HTMLButtonElement;
        titleInput.value = node.title || '';

        const validate = () => {
            if (titleInput.value.includes('/')) {
                errorEl.textContent = 'No "/" in study or folder name';
                confirmBtn.disabled = true;
                return false;
            }
            errorEl.textContent = '';
            confirmBtn.disabled = false;
            return true;
        };

        titleInput.addEventListener('input', validate);

        confirmBtn.addEventListener('click', async () => {
            if (!validate()) return;
            try {
                const ok = await renameNode(node, titleInput.value);
                if (!ok) return;
                close();
                refreshNodes(currentParentId);
            } catch (error) {
                console.error('Failed to rename node:', error);
                alert('Rename failed');
            }
        });
    };

    const openNodeActions = (node: any) => {
        const { overlay } = mountModal('node-actions-template');
        const title = overlay.querySelector('.modal-title') as HTMLElement;
        const eyebrow = overlay.querySelector('.modal-eyebrow') as HTMLElement;
        title.textContent = node.title;
        eyebrow.textContent = node.node_type === 'folder' ? 'Folder' : 'Study';
        const actions = overlay.querySelectorAll('.action-btn');
        actions.forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = (btn as HTMLButtonElement).dataset.action;
                if (action === 'move') {
                    overlay.remove();
                    await openMoveModal(node);
                }
                if (action === 'delete') {
                    overlay.remove();
                    openDeleteConfirm(node);
                }
                if (action === 'rename') {
                    overlay.remove();
                    openRenameModal(node);
                }
            });
        });
    };

    // Modal Handling
    const openCreateModal = (prefillType?: 'folder' | 'study') => {
        const modalTpl = document.getElementById('create-modal-template') as HTMLTemplateElement;
        const modal = document.importNode(modalTpl.content, true);
        const overlay = modal.querySelector('.modal-overlay') as HTMLElement;
        const card = overlay.querySelector('.modal-card') as HTMLElement;
        const closeBtns = overlay.querySelectorAll('.modal-close');
        const confirmBtn = overlay.querySelector('#confirm-create') as HTMLButtonElement;
        const typeSelect = overlay.querySelector('#new-type') as HTMLSelectElement;
        const titleInput = overlay.querySelector('#new-title') as HTMLInputElement;
        const titleError = overlay.querySelector('#new-title-error') as HTMLElement;

        document.body.appendChild(overlay);

        // Make draggable
        makeDraggable(card, { handle: '.modal-header' });

        const close = () => overlay.remove();
        closeBtns.forEach(btn => btn.addEventListener('click', close));

        if (prefillType) {
            typeSelect.value = prefillType;
            typeSelect.disabled = true;
        }

        const validateTitle = () => {
            const value = titleInput.value;
            if (value.includes('/')) {
                titleError.textContent = 'No "/" in study or folder name';
                confirmBtn.disabled = true;
                return false;
            }
            titleError.textContent = '';
            confirmBtn.disabled = false;
            return true;
        };

        titleInput.addEventListener('input', validateTitle);

        confirmBtn.addEventListener('click', async () => {
            const title = titleInput.value;
            const type = typeSelect.value;
            if (!title) return;
            if (!validateTitle()) return;

            try {
                // POST /api/v1/workspace/nodes
                await api.post('/api/v1/workspace/nodes', {
                    node_type: type,
                    title: title,
                    parent_id: currentParentId === 'root' ? null : currentParentId,
                    visibility: 'private'
                });
                close();
                allNodesCache = null;
                refreshNodes(currentParentId);
            } catch (error) {
                console.error('Failed to create node:', error);
                alert('Creation failed');
            }
        });
    };

    // 4. Initial Bindings
    newFolderBtn.addEventListener('click', () => openCreateModal('folder'));
    newStudyBtn.addEventListener('click', () => openCreateModal('study'));
    pathInput?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        resolvePath(pathInput.value).catch(() => shakePathInput());
    });
    pathInput?.addEventListener('focus', () => {
        const prefix = getPathPrefix();
        if (pathInput.value.endsWith('/...')) {
            pathInput.value = prefix;
        }
    });
    pathInput?.addEventListener('blur', () => {
        const prefix = getPathPrefix();
        if (pathInput.value === prefix) {
            pathInput.value = `${prefix}...`;
        }
    });
    pathInput?.addEventListener('keydown', (event) => {
        if (event.key !== 'Backspace') return;
        const start = pathInput.selectionStart ?? 0;
        if (start <= 5) {
            event.preventDefault();
        }
    });
    pathInput?.addEventListener('input', () => {
        if (!pathInput.value.startsWith('root/')) {
            pathInput.value = `root/${pathInput.value.replace(/^\/+/, '')}`;
        }
    });
    searchInput?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        runSearch(searchInput.value).catch(() => {});
    });
    searchClearBtn?.addEventListener('click', () => {
        searchInput.value = '';
        window.location.reload();
    });

    // Render LogoutButton React component
    const logoutContainer = container.querySelector('#logout-button-container') as HTMLElement;
    if (logoutContainer) {
        const root = ReactDOM.createRoot(logoutContainer);
        root.render(React.createElement(LogoutButton));
    }

    // Initial load
    if (startParentId && startParentId !== 'root') {
        // Navigate to specific folder
        try {
            console.log(`[WORKSPACE] Initializing to folder: ${startParentId}`);
            const node = await api.get(`/api/v1/workspace/nodes/${startParentId}`);
            if (node) {
                // Build breadcrumb path by traversing parents
                const path: Array<{id: string, title: string}> = [];
                let currentNode = node;
                let safety = 0;

                while (currentNode && safety < 20) {
                    safety++;
                    path.unshift({ id: currentNode.id, title: currentNode.title });
                    if (!currentNode.parent_id || currentNode.parent_id === 'root') {
                        break;
                    }
                    try {
                        currentNode = await api.get(`/api/v1/workspace/nodes/${currentNode.parent_id}`);
                    } catch {
                        break;
                    }
                }

                // Add root at the beginning
                breadcrumbPath = [{ id: 'root', title: 'Root' }, ...path];
                currentParentId = startParentId;

                renderBreadcrumb();
                await refreshNodes(startParentId);
                updatePathInputDisplay();

                console.log(`[WORKSPACE] ✓ Initialized to folder: ${node.title}`);
            } else {
                navigateToFolder('root', 'Root');
            }
        } catch (error) {
            console.error(`[WORKSPACE] Failed to load folder ${startParentId}:`, error);
            navigateToFolder('root', 'Root');
        }
    } else {
        navigateToFolder('root', 'Root');
    }
}
