import { getApiClient } from "../../api/client.js";
import { StudyApi } from "../../api/endpoints.js";
import { store } from "../../state/store.js";

export function bindStudyEditor(root: Element, baseUrl: string): void {
  const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));
  const moveList = root.querySelector("[data-slot='study-movelist']") as HTMLElement | null;
  if (!moveList) return;

  moveList.addEventListener("click", async (event) => {
    const active = store.getState().studies.active;
    if (!active.studyId) return;
    if (event.shiftKey) {
      await api.promoteVariation({ study_id: active.studyId, path: "main.1" });
    } else {
      await api.addMove({ study_id: active.studyId, move: "e4", path: "main.1" });
    }
    const presenceSocket = (window as any).__presenceSocket;
    if (presenceSocket) {
      presenceSocket.sendJson({
        type: "presence.cursor_moved",
        data: { study_id: active.studyId, chapter_id: active.chapterId, move_path: "main.1" },
      });
    }
  });

  moveList.addEventListener("contextmenu", async (event) => {
    event.preventDefault();
    const active = store.getState().studies.active;
    if (!active.studyId) return;
    await api.deleteMove({ study_id: active.studyId, path: "main.1" });
  });
}
