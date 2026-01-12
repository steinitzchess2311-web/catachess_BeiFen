import { loadHtml, mountHtml } from "../../bootstrap/dom.js";
import { renderDesktop } from "./renderDesktop.js";
import { renderTree } from "./renderTree.js";
import { renderNotifications } from "./renderNotifications.js";
import { createNotificationsController } from "../../features/notifications/notifications.controller.js";
import type { AppState } from "../../state/types.js";

export async function renderWorkspace(root: Element, state: AppState): Promise<void> {
  const page = root.querySelector("[data-page='workspace']") as HTMLElement | null;
  if (!page) return;

  const toolbarSlot = page.querySelector("[data-slot='toolbar']") as HTMLElement;
  if (toolbarSlot && !toolbarSlot.dataset.mounted) {
    toolbarSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/Toolbar.html");
    toolbarSlot.dataset.mounted = "true";
  }

  const desktopSlot = page.querySelector("[data-slot='desktop']") as HTMLElement;
  const treeSlot = page.querySelector("[data-slot='tree']") as HTMLElement;

  if (desktopSlot && !desktopSlot.dataset.mounted) {
    desktopSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/DesktopCanvas.html");
    desktopSlot.dataset.mounted = "true";
  }

  if (treeSlot && !treeSlot.dataset.mounted) {
    treeSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/TreeView.html");
    treeSlot.dataset.mounted = "true";
  }

  desktopSlot.style.display = state.ui.viewMode === "desktop" ? "block" : "none";
  treeSlot.style.display = state.ui.viewMode === "tree" ? "block" : "none";

  renderDesktop(root, state);
  renderTree(root, state);

  const rightContent = root.querySelector("[data-component='rightpanel'] [data-role='content']") as HTMLElement | null;
  if (rightContent) {
    if (state.ui.rightPanelTab === "notifications") {
      rightContent.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelNotifications.html");
      const controller = createNotificationsController(window.location.origin);
      controller.load();
      renderNotifications(rightContent, state);
    } else if (state.ui.rightPanelTab === "presence") {
      rightContent.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelPresence.html");
    } else if (state.ui.rightPanelTab === "versions") {
      rightContent.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelVersions.html");
    } else {
      rightContent.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelDiscussions.html");
    }
  }

  const overlay = root.querySelector("[data-slot='overlay']") as HTMLElement | null;
  if (overlay) {
    overlay.dataset.open = state.ui.dialogs.shareOpen || state.ui.dialogs.importOpen || state.ui.dialogs.exportOpen ? "true" : "false";
    overlay.innerHTML = "";
    if (state.ui.dialogs.shareOpen) {
      overlay.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/DialogShare.html");
    } else if (state.ui.dialogs.importOpen) {
      overlay.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/DialogImport.html");
    } else if (state.ui.dialogs.exportOpen) {
      overlay.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/DialogExport.html");
    }
  }

  const toast = root.querySelector("[data-slot='toast']") as HTMLElement | null;
  if (toast) {
    toast.textContent = state.ui.toast.message || "";
  }
}
