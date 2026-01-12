import { ApiClient } from "./client.js";

export class WorkspaceApi {
  constructor(private client: ApiClient) {}

  getWorkspace(id: string) {
    return this.client.request("GET", `/workspaces/${id}`);
  }

  createWorkspace(payload: { title: string }) {
    return this.client.request("POST", "/workspaces", payload);
  }

  createFolder(payload: { parent_id: string | null; title: string }) {
    return this.client.request("POST", "/folders", payload);
  }

  createStudy(payload: { parent_id: string | null; title: string }) {
    return this.client.request("POST", "/studies", payload);
  }

  moveNode(payload: { node_id: string; new_parent_id: string | null }) {
    return this.client.request("POST", "/nodes/move", payload);
  }

  copyNode(payload: { node_id: string; new_parent_id?: string | null }) {
    return this.client.request("POST", "/nodes/copy", payload);
  }

  deleteNode(nodeId: string) {
    return this.client.request("DELETE", `/nodes/${nodeId}`);
  }

  renameNode(type: "workspaces" | "folders" | "studies", id: string, payload: { title: string }) {
    return this.client.request("PUT", `/${type}/${id}`, payload);
  }
}

export class StudyApi {
  constructor(private client: ApiClient) {}

  getStudy(id: string) {
    return this.client.request("GET", `/studies/${id}`);
  }

  getChapters(id: string) {
    return this.client.request("GET", `/studies/${id}/chapters`);
  }

  importPgn(id: string, payload: { pgn?: string }) {
    return this.client.request("POST", `/studies/${id}/import-pgn`, payload);
  }

  exportStudy(id: string, payload: { format: "pgn" | "zip" }) {
    return this.client.request("POST", `/studies/${id}/export`, payload);
  }

  getExportJob(jobId: string) {
    return this.client.request("GET", `/export-jobs/${jobId}`);
  }

  addMove(payload: { study_id: string; move: string; path: string }) {
    return this.client.request("POST", "/study/move", payload);
  }

  deleteMove(payload: { study_id: string; path: string }) {
    return this.client.request("POST", "/study/move/delete", payload);
  }

  updateAnnotation(payload: { study_id: string; path: string; content: string; nag?: string }) {
    return this.client.request("POST", "/study/move/annotation", payload);
  }

  promoteVariation(payload: { study_id: string; path: string }) {
    return this.client.request("POST", "/study/variation/promote", payload);
  }

  reorderVariation(payload: { study_id: string; path: string; direction: "up" | "down" }) {
    return this.client.request("POST", "/study/variation/reorder", payload);
  }

  getVersions(studyId: string) {
    return this.client.request("GET", `/studies/${studyId}/versions`);
  }

  getVersionDiff(studyId: string, version: number) {
    return this.client.request("GET", `/studies/${studyId}/versions/${version}/diff`);
  }

  rollback(studyId: string, payload: { version: number }) {
    return this.client.request("POST", `/studies/${studyId}/rollback`, payload);
  }
}

export class DiscussionApi {
  constructor(private client: ApiClient) {}

  listDiscussions(targetId: string) {
    return this.client.request("GET", `/discussions?target=${encodeURIComponent(targetId)}`);
  }

  createThread(payload: { target_id: string; title: string; content: string; mentions?: string[] }) {
    return this.client.request("POST", "/discussions", payload);
  }

  addReply(threadId: string, payload: { content: string }) {
    return this.client.request("POST", `/discussions/${threadId}/replies`, payload);
  }

  editReply(replyId: string, payload: { content: string }) {
    return this.client.request("PUT", `/discussions/replies/${replyId}`, payload);
  }

  deleteReply(replyId: string) {
    return this.client.request("DELETE", `/discussions/replies/${replyId}`);
  }

  updateThread(threadId: string, payload: { title?: string; content?: string }) {
    return this.client.request("PUT", `/discussions/${threadId}`, payload);
  }

  deleteThread(threadId: string) {
    return this.client.request("DELETE", `/discussions/${threadId}`);
  }

  resolveThread(threadId: string) {
    return this.client.request("POST", `/discussions/${threadId}/resolve`);
  }

  pinThread(threadId: string) {
    return this.client.request("POST", `/discussions/${threadId}/pin`);
  }
}

export class UserApi {
  constructor(private client: ApiClient) {}

  search(query: string) {
    return this.client.request("GET", `/users?q=${encodeURIComponent(query)}`);
  }
}

export class NotificationApi {
  constructor(private client: ApiClient) {}

  list() {
    return this.client.request("GET", "/notifications");
  }

  markRead(id: string) {
    return this.client.request("POST", `/notifications/${id}/read`);
  }

  bulkRead() {
    return this.client.request("POST", "/notifications/bulk-read");
  }

  dismiss(id: string) {
    return this.client.request("POST", `/notifications/${id}/dismiss`);
  }

  updatePreferences(payload: Record<string, any>) {
    return this.client.request("PUT", "/notifications/preferences", payload);
  }
}

export class PresenceApi {
  constructor(private client: ApiClient) {}

  heartbeat(payload: { study_id: string; chapter_id?: string | null; move_path?: string | null }) {
    return this.client.request("POST", "/presence/heartbeat", payload);
  }

  list(studyId: string) {
    return this.client.request("GET", `/presence/${studyId}`);
  }
}
