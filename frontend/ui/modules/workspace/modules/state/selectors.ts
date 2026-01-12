import type { AppState } from "./types.js";

export const selectViewMode = (state: AppState) => state.ui.viewMode;
export const selectTheme = (state: AppState) => state.ui.theme;
export const selectRightPanelTab = (state: AppState) => state.ui.rightPanelTab;
export const selectNodes = (state: AppState) => Object.values(state.nodes.byId);
export const selectNodeById = (state: AppState, id: string) => state.nodes.byId[id];
export const selectChildren = (state: AppState, parentId: string | null) =>
  state.nodes.childrenByParent[parentId || "root"] || [];
export const selectActiveStudy = (state: AppState) => state.studies.active;
export const selectChapters = (state: AppState, studyId: string) =>
  state.studies.chaptersByStudy[studyId] || [];
export const selectVersions = (state: AppState, studyId: string) =>
  state.studies.versionsByStudy[studyId] || [];
export const selectNotifications = (state: AppState) => state.notifications.items;
export const selectPresence = (state: AppState, studyId: string) =>
  state.presence.byStudyId[studyId] || { users: [], cursors: {} };
