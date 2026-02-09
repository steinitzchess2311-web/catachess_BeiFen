// Orchestrates all workspace modules and creates coordination functions

import { WorkspaceState, WorkspaceElements, WorkspaceOptions, ModalRoots } from './types';
import { setSortSettings } from './state';
import { renderSortToggles, ReactRoots } from './reactComponents';
import { createHandlerWrappers } from './handlerWrappers';

export function createOrchestrator(
    container: HTMLElement,
    state: WorkspaceState,
    elements: WorkspaceElements,
    options: WorkspaceOptions,
    modalRoots: ModalRoots,
    reactRoots: ReactRoots
) {
    // Forward declarations for circular dependencies
    let renderSortTogglesWrapper: () => void;
    let handlers: ReturnType<typeof createHandlerWrappers>;

    // Create handler wrappers
    handlers = createHandlerWrappers(
        state,
        elements,
        options,
        modalRoots
    );

    // Define renderSortTogglesWrapper
    renderSortTogglesWrapper = () => {
        renderSortToggles(container, reactRoots, state, (key, dir) => {
            setSortSettings(state, key, dir);
            renderSortTogglesWrapper();
            handlers.refreshNodes(state.currentParentId);
        });
    };

    return {
        handlers,
        renderSortTogglesWrapper
    };
}
