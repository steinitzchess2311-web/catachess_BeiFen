import { createPresenceController } from "./presence.controller.js";
import { store } from "../../state/store.js";

export function startHeartbeat(baseUrl: string): () => void {
  const controller = createPresenceController(baseUrl);
  const interval = window.setInterval(async () => {
    const active = store.getState().studies.active;
    if (!active.studyId) return;
    await controller.heartbeat(active.studyId, active.chapterId, null);
  }, 30000);

  return () => window.clearInterval(interval);
}
