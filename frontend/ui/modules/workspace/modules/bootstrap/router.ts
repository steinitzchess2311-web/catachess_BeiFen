import { loadHtml } from "./dom.js";
import { store } from "../state/store.js";
import { renderWorkspace } from "../ui/render/renderWorkspace.js";
import { renderStudy } from "../ui/render/renderStudy.js";
import { createPresenceSocket, createWorkspaceSocket } from "../realtime/subscriptions.js";

function parseRoute(pathname: string): { page: "workspace" | "study"; id?: string } {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "studies" && parts[1]) {
    return { page: "study", id: parts[1] };
  }
  if (parts[0] === "workspaces" && parts[1]) {
    return { page: "workspace", id: parts[1] };
  }
  return { page: "workspace" };
}

export function initRouter(root: Element): void {
  const mainSlot = root.querySelector("[data-slot='main']") as HTMLElement;
  let socket: { disconnect: () => void } | null = null;

  const renderRoute = async () => {
    const route = parseRoute(window.location.pathname);
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    if (route.page === "study") {
      mainSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/StudyPage.html");
      store.dispatch({ type: "STUDY_SET_ACTIVE", payload: { studyId: route.id, chapterId: null } });
      renderStudy(root, store.getState());
      if (route.id) {
        socket = createPresenceSocket(window.location.origin, route.id);
        socket.connect();
        (window as any).__presenceSocket = socket;
      }
      return;
    }
    mainSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/WorkspacePage.html");
    renderWorkspace(root, store.getState());
    if (route.id) {
      socket = createWorkspaceSocket(window.location.origin, route.id);
      socket.connect();
    }
  };

  window.addEventListener("popstate", renderRoute);
  renderRoute();
}
