import { getApiClient } from "../../api/client.js";
import { PresenceApi } from "../../api/endpoints.js";
import { store } from "../../state/store.js";

export function createPresenceController(baseUrl: string) {
  const api = new PresenceApi(getApiClient(baseUrl, store.getState().session.token));

  return {
    async heartbeat(studyId: string, chapterId?: string | null, movePath?: string | null) {
      await api.heartbeat({ study_id: studyId, chapter_id: chapterId, move_path: movePath });
    },
    async list(studyId: string) {
      const response = await api.list(studyId);
      store.dispatch({ type: "PRESENCE_SET", payload: { byStudyId: { [studyId]: response } } });
    },
  };
}
