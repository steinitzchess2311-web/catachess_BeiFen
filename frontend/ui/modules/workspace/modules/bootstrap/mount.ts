import { loadHtml, mountHtml } from "./dom.js";
import { initRouter } from "./router.js";
import { store } from "../state/store.js";
import { bindTopNav } from "../ui/bindings/bindTopNav.js";
import { bindToolbar } from "../ui/bindings/bindToolbar.js";
import { bindSidebar } from "../ui/bindings/bindSidebar.js";
import { bindDesktop } from "../ui/bindings/bindDesktop.js";
import { bindStudy } from "../ui/bindings/bindStudy.js";
import { renderWorkspace } from "../ui/render/renderWorkspace.js";
import { renderStudy } from "../ui/render/renderStudy.js";

const STYLE_PATHS = [
  "/frontend/ui/modules/workspace/styles/tokens/colors.morandi.css",
  "/frontend/ui/modules/workspace/styles/tokens/spacing.css",
  "/frontend/ui/modules/workspace/styles/tokens/radius.css",
  "/frontend/ui/modules/workspace/styles/tokens/typography.css",
  "/frontend/ui/modules/workspace/styles/tokens/shadow.css",
  "/frontend/ui/modules/workspace/styles/tokens/zindex.css",
  "/frontend/ui/modules/workspace/styles/theme/theme.base.css",
  "/frontend/ui/modules/workspace/styles/theme/theme.morandi.light.css",
  "/frontend/ui/modules/workspace/styles/theme/theme.morandi.dark.css",
  "/frontend/ui/modules/workspace/styles/theme/theme.alt.placeholder.css",
  "/frontend/ui/modules/workspace/styles/components/buttons.css",
  "/frontend/ui/modules/workspace/styles/components/inputs.css",
  "/frontend/ui/modules/workspace/styles/components/cards.css",
  "/frontend/ui/modules/workspace/styles/components/panels.css",
  "/frontend/ui/modules/workspace/styles/components/chessboard.css",
  "/frontend/ui/modules/workspace/styles/components/markdown.css",
  "/frontend/ui/modules/workspace/styles/pages/workspace.css",
  "/frontend/ui/modules/workspace/styles/pages/study.css",
];

function ensureStyles(): void {
  const head = document.head;
  STYLE_PATHS.forEach((path) => {
    if (document.querySelector(`link[data-workspace-style="${path}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = path;
    link.dataset.workspaceStyle = path;
    head.appendChild(link);
  });
}

function applyTheme(): void {
  let theme = store.getState().ui.theme;
  try {
    const stored = localStorage.getItem("workspace-theme");
    if (stored) {
      theme = JSON.parse(stored);
      store.dispatch({ type: "UI_SET_THEME", payload: theme });
    }
  } catch {
    theme = store.getState().ui.theme;
  }
  document.documentElement.dataset.theme = theme.theme;
  document.documentElement.dataset.palette = theme.palette;
}

export async function mountWorkspaceApp(rootSelector = "#app"): Promise<void> {
  ensureStyles();
  const root = document.querySelector(rootSelector) || document.body;
  const shellHtml = await loadHtml("/frontend/ui/modules/workspace/layout/AppShell.html");
  mountHtml(root, shellHtml);

  const topNavSlot = root.querySelector("[data-slot='topnav']") as HTMLElement;
  const leftSlot = root.querySelector("[data-slot='leftsidebar']") as HTMLElement;
  const rightSlot = root.querySelector("[data-slot='rightpanel']") as HTMLElement;

  topNavSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/TopNav.html");
  leftSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/LeftSidebar.html");
  rightSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/RightPanel.html");

  bindTopNav(root);
  bindSidebar(root);

  initRouter(root);
  applyTheme();

  store.subscribe((state) => {
    applyTheme();
    if (state.ui.viewMode) {
      renderWorkspace(root, state);
      renderStudy(root, state);
    }
  });

  bindToolbar(root);
  bindDesktop(root);
  bindStudy(root);
}
