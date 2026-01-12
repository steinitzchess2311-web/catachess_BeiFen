import { WorkspaceSocket } from "./ws.js";

export function createWorkspaceSocket(baseUrl: string, workspaceId: string): WorkspaceSocket {
  const url = `${baseUrl.replace("http", "ws")}/events?scope=workspace:${workspaceId}`;
  return new WorkspaceSocket(url);
}

export function createPresenceSocket(baseUrl: string, studyId: string): WorkspaceSocket {
  const url = `${baseUrl.replace("http", "ws")}/ws/presence?study_id=${studyId}`;
  return new WorkspaceSocket(url);
}
