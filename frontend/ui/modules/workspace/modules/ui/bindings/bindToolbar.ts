import { createNodesController } from "../../features/nodes/nodes.controller.js";
import { store } from "../../state/store.js";

export function bindToolbar(root: Element): void {
  const baseUrl = window.location.origin;
  const controller = createNodesController(baseUrl);

  root.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const action = target?.dataset?.action;
    if (!action) return;

    if (action === "new-workspace") {
      const title = window.prompt("Workspace name", "New Workspace");
      if (title) await controller.createWorkspace(title);
    }

    if (action === "new-folder") {
      const title = window.prompt("Folder name", "New Folder");
      if (title) await controller.createFolder(null, title);
    }

    if (action === "new-study") {
      const title = window.prompt("Study name", "New Study");
      if (title) await controller.createStudy(null, title);
    }

    if (action === "view-toggle") {
      const viewMode = store.getState().ui.viewMode === "desktop" ? "tree" : "desktop";
      store.dispatch({ type: "UI_SET_VIEW_MODE", payload: viewMode });
    }

    if (action === "share") {
      store.dispatch({ type: "UI_SET_DIALOGS", payload: { shareOpen: true } });
    }

    if (action === "import") {
      store.dispatch({ type: "UI_SET_DIALOGS", payload: { importOpen: true } });
    }

    if (action === "export") {
      store.dispatch({ type: "UI_SET_DIALOGS", payload: { exportOpen: true } });
    }

    if (action === "dialog-close") {
      store.dispatch({
        type: "UI_SET_DIALOGS",
        payload: { shareOpen: false, importOpen: false, exportOpen: false, confirmOpen: false },
      });
    }
  });
}
