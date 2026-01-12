import type { Action, AppState, NodeItem, NodeLayout, PresenceUser } from "./types.js";

export const initialState: AppState = {
  session: { userId: null, token: null },
  ui: {
    viewMode: "desktop",
    rightPanelTab: "discussions",
    theme: { theme: "light", palette: "morandi" },
    dialogs: { shareOpen: false, importOpen: false, exportOpen: false, confirmOpen: false },
    toast: { message: null },
  },
  nodes: {
    byId: {},
    childrenByParent: {},
    layoutByNode: {},
    selected: { ids: [] },
  },
  studies: {
    byId: {},
    chaptersByStudy: {},
    versionsByStudy: {},
    active: { studyId: null, chapterId: null, plyIndex: 0 },
  },
  discussions: { threadsByTargetId: {}, repliesByThreadId: {} },
  notifications: { items: [], unreadCount: 0 },
  presence: { byStudyId: {} },
  jobs: { exportById: {} },
  acl: { rolesByNode: {} },
};

export function rootReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "UI_SET_VIEW_MODE":
      return { ...state, ui: { ...state.ui, viewMode: action.payload } };
    case "UI_SET_THEME":
      return { ...state, ui: { ...state.ui, theme: action.payload } };
    case "UI_SET_RIGHT_TAB":
      return { ...state, ui: { ...state.ui, rightPanelTab: action.payload } };
    case "UI_SET_DIALOGS":
      return { ...state, ui: { ...state.ui, dialogs: { ...state.ui.dialogs, ...action.payload } } };
    case "UI_SET_TOAST":
      return { ...state, ui: { ...state.ui, toast: { message: action.payload } } };
    case "SESSION_SET":
      return { ...state, session: { ...state.session, ...action.payload } };
    case "NODES_UPSERT":
      return { ...state, nodes: upsertNodes(state.nodes, action.payload || []) };
    case "NODES_REMOVE":
      return { ...state, nodes: removeNodes(state.nodes, action.payload || []) };
    case "NODES_SET_CHILDREN":
      return {
        ...state,
        nodes: { ...state.nodes, childrenByParent: { ...state.nodes.childrenByParent, ...action.payload } },
      };
    case "NODES_SET_LAYOUT":
      return {
        ...state,
        nodes: { ...state.nodes, layoutByNode: { ...state.nodes.layoutByNode, ...action.payload } },
      };
    case "NODES_SELECT":
      return { ...state, nodes: { ...state.nodes, selected: { ids: action.payload || [] } } };
    case "STUDY_SET_ACTIVE":
      return { ...state, studies: { ...state.studies, active: { ...state.studies.active, ...action.payload } } };
    case "STUDY_SET_CHAPTERS":
      return {
        ...state,
        studies: {
          ...state.studies,
          chaptersByStudy: { ...state.studies.chaptersByStudy, ...action.payload },
        },
      };
    case "STUDY_SET_VERSIONS":
      return {
        ...state,
        studies: {
          ...state.studies,
          versionsByStudy: { ...state.studies.versionsByStudy, ...action.payload },
        },
      };
    case "DISCUSSIONS_SET":
      return { ...state, discussions: { ...state.discussions, ...action.payload } };
    case "NOTIFICATIONS_SET":
      return { ...state, notifications: { ...state.notifications, ...action.payload } };
    case "ACL_SET":
      return { ...state, acl: { rolesByNode: { ...state.acl.rolesByNode, ...action.payload } } };
    case "PRESENCE_SET":
      return { ...state, presence: { ...state.presence, ...action.payload } };
    case "JOBS_SET":
      return { ...state, jobs: { ...state.jobs, ...action.payload } };
    default:
      return state;
  }
}

function upsertNodes(nodesState: AppState["nodes"], nodes: NodeItem[]): AppState["nodes"] {
  const byId = { ...nodesState.byId };
  nodes.forEach((node) => {
    byId[node.id] = node;
  });
  return { ...nodesState, byId };
}

function removeNodes(nodesState: AppState["nodes"], nodeIds: string[]): AppState["nodes"] {
  const byId = { ...nodesState.byId };
  nodeIds.forEach((id) => delete byId[id]);
  return { ...nodesState, byId };
}

export function mergeLayout(layoutByNode: Record<string, NodeLayout>, updates: Record<string, NodeLayout>) {
  return { ...layoutByNode, ...updates };
}

export function mergePresenceUsers(
  users: PresenceUser[],
  updates: PresenceUser[]
): PresenceUser[] {
  const byId: Record<string, PresenceUser> = {};
  users.forEach((user) => {
    byId[user.userId] = user;
  });
  updates.forEach((user) => {
    byId[user.userId] = user;
  });
  return Object.values(byId);
}
