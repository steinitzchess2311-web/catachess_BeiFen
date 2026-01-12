import { bindChapters } from "../../features/study/study.chapters.js";
import { bindStudyEditor } from "../../features/study/study.editor.js";
import { bindStudyImport } from "../../features/study/study.import.js";
import { bindStudyExport } from "../../features/study/study.export.js";
import { bindAnnotations } from "../../features/study/study.annotations.js";
import { startHeartbeat } from "../../features/presence/presence.heartbeat.js";
import { store } from "../../state/store.js";
import { createDiscussionsController } from "../../features/discussions/discussions.controller.js";
import { createVersionsController } from "../../features/study/study.versions.js";
import { createNotificationsController } from "../../features/notifications/notifications.controller.js";
import { matchMentionQuery } from "../../features/discussions/discussions.mentions.js";
import { UserApi } from "../../api/endpoints.js";
import { getApiClient } from "../../api/client.js";
import { StudyApi } from "../../api/endpoints.js";

export function bindStudy(root: Element): void {
  const baseUrl = window.location.origin;
  bindChapters(root);
  bindStudyEditor(root, baseUrl);
  bindStudyImport(root, baseUrl);
  bindStudyExport(root, baseUrl);
  bindAnnotations(root, baseUrl);
  startHeartbeat(baseUrl);

  const rightPanel = root.querySelector("[data-component='rightpanel']") as HTMLElement | null;
  if (rightPanel) {
    rightPanel.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const tab = target?.dataset?.tab;
      if (!tab) return;
      store.dispatch({ type: "UI_SET_RIGHT_TAB", payload: tab });
    });
  }

  root.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    if (target?.dataset?.action !== "discussion-create") return;
    const active = store.getState().studies.active.studyId;
    if (!active) return;
    const panel = root.querySelector("[data-component='panel-discussions']") as HTMLElement | null;
    const title = panel?.querySelector("[data-role='discussion-title']") as HTMLInputElement | null;
    const content = panel?.querySelector("[data-role='discussion-content']") as HTMLTextAreaElement | null;
    if (!title || !content) return;
    const controller = createDiscussionsController(baseUrl);
    await controller.createThread(active, title.value, content.value);
    title.value = "";
    content.value = "";
  });

  root.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    if (target?.dataset?.action !== "version-rollback") return;
    const active = store.getState().studies.active.studyId;
    if (!active) return;
    const versionId = Number(target.dataset.version);
    if (!versionId) return;
    const controller = createVersionsController(baseUrl);
    await controller.rollback(active, versionId);
  });

  root.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    if (!target?.dataset?.action?.startsWith("nag-")) return;
    const active = store.getState().studies.active;
    if (!active.studyId || !active.chapterId) return;
    const nag = target.dataset.action.replace("nag-", "");
    const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));
    await api.updateAnnotation({ study_id: active.studyId, path: active.chapterId, content: "", nag });
  });

  root.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    if (!target?.dataset?.action) return;
    const controller = createDiscussionsController(baseUrl);

    if (target.dataset.action === "discussion-reply") {
      const threadId = target.dataset.threadId as string;
      const container = target.closest("[data-thread-id]") as HTMLElement | null;
      const reply = container?.querySelector("[data-role='reply-content']") as HTMLTextAreaElement | null;
      if (threadId && reply?.value) {
        await controller.addReply(threadId, reply.value);
        reply.value = "";
      }
    }

    if (target.dataset.action === "discussion-resolve") {
      const threadId = target.dataset.threadId as string;
      if (threadId) await controller.resolveThread(threadId);
    }

    if (target.dataset.action === "discussion-pin") {
      const threadId = target.dataset.threadId as string;
      if (threadId) await controller.pinThread(threadId);
    }

    if (target.dataset.action === "discussion-delete") {
      const threadId = target.dataset.threadId as string;
      if (threadId) await controller.deleteThread(threadId);
    }
  });

  root.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    if (target?.dataset?.action !== "preferences-save") return;
    const panel = root.querySelector("[data-component='panel-notifications']") as HTMLElement | null;
    const prefs = panel?.querySelectorAll("[data-pref]") || [];
    const payload: Record<string, any> = {};
    prefs.forEach((pref) => {
      const input = pref as HTMLInputElement;
      payload[input.dataset.pref || ""] = input.checked;
    });
    const controller = createNotificationsController(baseUrl);
    await controller.updatePreferences(payload);
  });

  root.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    if (!target?.dataset?.action) return;
    const controller = createNotificationsController(baseUrl);
    if (target.dataset.action === "notifications-bulk-read") {
      await controller.bulkRead();
    }
    if (target.dataset.action === "notification-read") {
      const id = target.dataset.notificationId as string;
      if (id) await controller.markRead(id);
    }
    if (target.dataset.action === "notification-dismiss") {
      const id = target.dataset.notificationId as string;
      if (id) await controller.dismiss(id);
    }
  });

  root.addEventListener("input", async (event) => {
    const target = event.target as HTMLTextAreaElement;
    if (!target?.dataset?.role || target.dataset.role !== "discussion-content") return;
    const query = matchMentionQuery(target.value);
    if (!query) return;
    const api = new UserApi(getApiClient(baseUrl, store.getState().session.token));
    await api.search(query);
  });
}
