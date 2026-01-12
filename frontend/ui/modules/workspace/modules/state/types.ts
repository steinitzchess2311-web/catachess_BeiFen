export type ViewMode = "desktop" | "tree";
export type RightPanelTab = "discussions" | "versions" | "presence" | "notifications";
export type ThemeMode = "light" | "dark";
export type Palette = "morandi" | "alt1" | "alt2";

export type NodeType = "workspace" | "folder" | "study";

export interface ThemeState {
  theme: ThemeMode;
  palette: Palette;
}

export interface UIState {
  viewMode: ViewMode;
  rightPanelTab: RightPanelTab;
  theme: ThemeState;
  dialogs: {
    shareOpen: boolean;
    importOpen: boolean;
    exportOpen: boolean;
    confirmOpen: boolean;
  };
  toast: { message: string | null };
}

export interface NodeLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface NodeItem {
  id: string;
  type: NodeType;
  title: string;
  parentId: string | null;
  meta?: string;
}

export interface NodesState {
  byId: Record<string, NodeItem>;
  childrenByParent: Record<string, string[]>;
  layoutByNode: Record<string, NodeLayout>;
  selected: { ids: string[] };
}

export interface StudyMeta {
  id: string;
  title: string;
}

export interface ChapterMeta {
  id: string;
  title: string;
}

export interface StudiesState {
  byId: Record<string, StudyMeta>;
  chaptersByStudy: Record<string, ChapterMeta[]>;
  versionsByStudy: Record<string, StudyVersion[]>;
  active: { studyId: string | null; chapterId: string | null; plyIndex: number };
}

export interface StudyVersion {
  version: number;
  summary?: string;
  created_at?: string;
}

export interface DiscussionThread {
  id: string;
  targetId: string;
  title: string;
  status: "open" | "resolved";
}

export interface DiscussionsState {
  threadsByTargetId: Record<string, DiscussionThread[]>;
  repliesByThreadId: Record<string, string[]>;
}

export interface AclState {
  rolesByNode: Record<string, string>;
}

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
}

export interface NotificationsState {
  items: NotificationItem[];
  unreadCount: number;
}

export interface PresenceUser {
  userId: string;
  status: "active" | "idle" | "away";
  chapterId?: string;
  movePath?: string | null;
}

export interface PresenceState {
  byStudyId: Record<string, { users: PresenceUser[]; cursors: Record<string, PresenceUser> }>;
}

export interface ExportJob {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  downloadUrl?: string | null;
}

export interface JobsState {
  exportById: Record<string, ExportJob>;
}

export interface SessionState {
  userId: string | null;
  token: string | null;
}

export interface AppState {
  session: SessionState;
  ui: UIState;
  nodes: NodesState;
  studies: StudiesState;
  discussions: DiscussionsState;
  notifications: NotificationsState;
  presence: PresenceState;
  jobs: JobsState;
  acl: AclState;
}

export interface Action<T = any> {
  type: string;
  payload?: T;
}
