import { getApiClient } from "../../api/client.js";
import { StudyApi } from "../../api/endpoints.js";
import { store } from "../../state/store.js";

export function bindStudyExport(root: Element, baseUrl: string): void {
  const overlay = root.querySelector("[data-slot='overlay']") as HTMLElement | null;
  if (!overlay) return;

  overlay.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    if (!target?.dataset?.action) return;
    const active = store.getState().studies.active;
    if (!active.studyId) return;

    const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));

    const format = target.dataset.action === "export-pgn" ? "pgn" : "zip";
    if (format) {
      const job = await api.exportStudy(active.studyId, { format: format as "pgn" | "zip" });
      store.dispatch({ type: "JOBS_SET", payload: { exportById: { [job.id]: job } } });
      pollExportJob(api, job.id);
    }
  });
}

async function pollExportJob(api: StudyApi, jobId: string) {
  const interval = window.setInterval(async () => {
    const job = await api.getExportJob(jobId);
    store.dispatch({ type: "JOBS_SET", payload: { exportById: { [jobId]: job } } });
    if (job.status === "completed") {
      store.dispatch({ type: "UI_SET_TOAST", payload: "Export completed" });
      window.clearInterval(interval);
    }
    if (job.status === "failed") {
      store.dispatch({ type: "UI_SET_TOAST", payload: "Export failed" });
      window.clearInterval(interval);
    }
  }, 3000);
}
