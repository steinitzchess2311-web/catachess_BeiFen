// React components rendering logic

import React from 'react';
import ReactDOM from 'react-dom/client';
import SortToggles from '../../../../web/src/components/workspace/SortToggles';
import { WorkspaceState, SortKey, SortDir } from './types';

export interface ReactRoots {
    sortTogglesRoot: ReactDOM.Root | null;
}

export function createReactRoots(): ReactRoots {
    return {
        sortTogglesRoot: null
    };
}

export function renderSortToggles(
    container: HTMLElement,
    roots: ReactRoots,
    state: WorkspaceState,
    onSortChange: (key: SortKey, dir: SortDir) => void
) {
    const sortTogglesContainer = container.querySelector('#sort-toggles-container') as HTMLElement;
    if (!sortTogglesContainer) return;

    if (!roots.sortTogglesRoot) {
        roots.sortTogglesRoot = ReactDOM.createRoot(sortTogglesContainer);
    }

    roots.sortTogglesRoot.render(
        React.createElement(SortToggles, {
            sortKey: state.sortKey,
            sortDir: state.sortDir,
            onSortChange
        })
    );
}
