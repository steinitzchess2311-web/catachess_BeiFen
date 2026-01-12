import { getApiClient } from "../../api/client.js";
import { StudyApi } from "../../api/endpoints.js";
import { store } from "../../state/store.js";

export function bindAnnotations(root: Element, baseUrl: string): void {
  const panel = root.querySelector("[data-slot='study-right']") as HTMLElement | null;
  if (!panel) return;

  const textarea = panel.querySelector("textarea[data-role='annotation']") as HTMLTextAreaElement | null;
  if (!textarea) return;

  textarea.addEventListener("change", async () => {
    const active = store.getState().studies.active;
    if (!active.studyId || !active.chapterId) return;
    const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));
    await api.updateAnnotation({ study_id: active.studyId, path: active.chapterId, content: textarea.value });
  });
}
