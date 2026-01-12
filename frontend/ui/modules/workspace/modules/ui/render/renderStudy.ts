import { loadHtml } from "../../bootstrap/dom.js";
import type { AppState } from "../../state/types.js";
import { renderDiscussions } from "./renderDiscussions.js";
import { renderNotifications } from "./renderNotifications.js";
import { renderVersions } from "./renderVersions.js";
import { createDiscussionsController } from "../../features/discussions/discussions.controller.js";
import { createVersionsController } from "../../features/study/study.versions.js";

export async function renderStudy(root: Element, state: AppState): Promise<void> {
  const page = root.querySelector("[data-page='study']") as HTMLElement | null;
  if (!page) return;

  const toolbarSlot = page.querySelector("[data-slot='toolbar']") as HTMLElement;
  if (toolbarSlot && !toolbarSlot.dataset.mounted) {
    toolbarSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/Toolbar.html");
    toolbarSlot.dataset.mounted = "true";
  }

  const chaptersSlot = page.querySelector("[data-slot='study-chapters']") as HTMLElement;
  const activeStudy = state.studies.active.studyId;
  const chapters = activeStudy ? state.studies.chaptersByStudy[activeStudy] || [] : [];
  chaptersSlot.innerHTML = chapters
    .map((chapter) => `<div class="chapter-item" data-chapter-id="${chapter.id}">${chapter.title}</div>`)
    .join("");

  const right = page.querySelector("[data-slot='study-right']") as HTMLElement;
  if (state.ui.rightPanelTab === "discussions") {
    right.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelDiscussions.html");
    if (activeStudy) {
      const controller = createDiscussionsController(window.location.origin);
      controller.load(activeStudy);
    }
    renderDiscussions(right, state);
  } else if (state.ui.rightPanelTab === "versions") {
    right.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelVersions.html");
    if (activeStudy) {
      const controller = createVersionsController(window.location.origin);
      controller.loadVersions(activeStudy);
    }
    renderVersions(right, state);
  } else if (state.ui.rightPanelTab === "presence") {
    right.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelPresence.html");
    const list = right.querySelector("[data-role='presence']") as HTMLElement | null;
    if (list && activeStudy) {
      const presence = state.presence.byStudyId[activeStudy]?.users || [];
      list.innerHTML = presence.map((user) => `<div class=\"presence-item\">${user.userId} (${user.status})</div>`).join("");
    }
  } else {
    right.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelNotifications.html");
    renderNotifications(right, state);
  }
}
