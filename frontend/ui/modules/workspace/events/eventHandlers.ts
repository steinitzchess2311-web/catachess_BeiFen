// Event handlers setup

import { WorkspaceState, WorkspaceElements, WorkspaceOptions } from './types';
import { getPathPrefix, shakePathInput, resolvePath } from './navigation';
import { runSearch } from './search';

export function setupEventHandlers(
    state: WorkspaceState,
    elements: WorkspaceElements,
    options: WorkspaceOptions,
    handlers: {
        openCreateModal: (type: 'folder' | 'study') => void;
        navigateToFolder: (id: string, title: string) => Promise<void>;
        renderItems: (nodes: any[]) => void;
        refreshNodes: (parentId: string) => Promise<void>;
    }
) {
    // New folder/study buttons
    elements.newFolderBtn.addEventListener('click', () => handlers.openCreateModal('folder'));
    elements.newStudyBtn.addEventListener('click', () => handlers.openCreateModal('study'));

    // Path input - Enter key
    elements.pathInput?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        resolvePath(
            state,
            elements,
            elements.pathInput.value,
            options,
            handlers.navigateToFolder
        ).catch(() => shakePathInput(elements));
    });

    // Path input - Focus
    elements.pathInput?.addEventListener('focus', () => {
        const prefix = getPathPrefix(state);
        if (elements.pathInput.value.endsWith('/...')) {
            elements.pathInput.value = prefix;
        }
    });

    // Path input - Blur
    elements.pathInput?.addEventListener('blur', () => {
        const prefix = getPathPrefix(state);
        if (elements.pathInput.value === prefix) {
            elements.pathInput.value = `${prefix}...`;
        }
    });

    // Path input - Prevent deleting 'root/'
    elements.pathInput?.addEventListener('keydown', (event) => {
        if (event.key !== 'Backspace') return;
        const start = elements.pathInput.selectionStart ?? 0;
        if (start <= 5) {
            event.preventDefault();
        }
    });

    // Path input - Auto-prepend 'root/'
    elements.pathInput?.addEventListener('input', () => {
        if (!elements.pathInput.value.startsWith('root/')) {
            elements.pathInput.value = `root/${elements.pathInput.value.replace(/^\/+/, '')}`;
        }
    });

    // Search input - Enter key
    elements.searchInput?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        console.log('[Search] Running search for:', elements.searchInput.value);
        runSearch(state, elements.searchInput.value, handlers.renderItems, handlers.refreshNodes).catch((err) => {
            console.error('[Search] Search failed:', err);
        });
    });

    // Search clear button
    elements.searchClearBtn?.addEventListener('click', () => {
        elements.searchInput.value = '';
        window.location.reload();
    });

    // Items grid - dragover
    elements.itemsGrid.addEventListener('dragover', (event) => {
        if (!state.dragNode) return;
        event.preventDefault();
    });
}
