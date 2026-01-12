import { getApiClient } from "../../api/client.js";
import { StudyApi } from "../../api/endpoints.js";
import { store } from "../../state/store.js";

export function bindStudyImport(root: Element, baseUrl: string): void {
  const overlay = root.querySelector("[data-slot='overlay']") as HTMLElement | null;
  if (!overlay) return;

  overlay.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    if (target?.dataset?.action !== "import-confirm") return;

    const active = store.getState().studies.active;
    if (!active.studyId) return;

    const textarea = overlay.querySelector("[data-dialog='import'] textarea[data-field='pgn']") as HTMLTextAreaElement | null;
    const pgn = textarea?.value || "";

    const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));
    await api.importPgn(active.studyId, { pgn });
    store.dispatch({ type: "UI_SET_DIALOGS", payload: { importOpen: false } });
  });
}
