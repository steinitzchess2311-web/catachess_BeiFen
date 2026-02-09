// Type definitions for workspace module

export type WorkspaceOptions = {
    onOpenStudy?: (studyId: string) => void;
    initialParentId?: string;
};

export type SortKey = 'created' | 'modified' | null;
export type SortDir = 'asc' | 'desc';

export interface WorkspaceState {
    currentParentId: string;
    breadcrumbPath: Array<{id: string, title: string}>;
    allNodesCache: any[] | null;
    dragNode: any | null;
    sortKey: SortKey;
    sortDir: SortDir;
    isBatchMode: boolean;
    selectedItemIds: Set<string>;
    currentNodes: any[];
}

export interface WorkspaceElements {
    container: HTMLElement;
    itemsGrid: HTMLElement;
    breadcrumb: HTMLElement;
    folderTree: HTMLElement;
    newFolderBtn: HTMLButtonElement;
    newStudyBtn: HTMLButtonElement;
    pathInput: HTMLInputElement;
    searchInput: HTMLInputElement;
    searchClearBtn: HTMLButtonElement;
}

export interface ModalRoots {
    modalContainer: HTMLDivElement | null;
    modalRoot: any;
    actionsModalContainer: HTMLDivElement | null;
    actionsModalRoot: any;
    moveModalContainer: HTMLDivElement | null;
    moveModalRoot: any;
    renameModalContainer: HTMLDivElement | null;
    renameModalRoot: any;
    deleteModalContainer: HTMLDivElement | null;
    deleteModalRoot: any;
    dragMoveModalContainer: HTMLDivElement | null;
    dragMoveModalRoot: any;
}
