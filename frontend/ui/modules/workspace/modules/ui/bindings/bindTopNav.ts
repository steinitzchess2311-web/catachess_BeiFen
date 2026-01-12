import { store } from "../../state/store.js";

export function bindTopNav(root: Element): void {
  const themeBtn = root.querySelector("[data-role='theme-toggle']") as HTMLButtonElement | null;
  const paletteSelect = root.querySelector("[data-role='palette-select']") as HTMLSelectElement | null;
  const unreadBadge = root.querySelector("[data-role='unread']") as HTMLElement | null;

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = store.getState().ui.theme.theme;
      const next = current === "light" ? "dark" : "light";
      store.dispatch({ type: "UI_SET_THEME", payload: { ...store.getState().ui.theme, theme: next } });
    });
  }

  if (paletteSelect) {
    paletteSelect.addEventListener("change", () => {
      store.dispatch({
        type: "UI_SET_THEME",
        payload: { ...store.getState().ui.theme, palette: paletteSelect.value },
      });
    });
  }

  store.subscribe((state) => {
    try {
      localStorage.setItem("workspace-theme", JSON.stringify(state.ui.theme));
    } catch {
      return;
    }
    if (unreadBadge) {
      unreadBadge.textContent = String(state.notifications.unreadCount || 0);
    }
  });
}
