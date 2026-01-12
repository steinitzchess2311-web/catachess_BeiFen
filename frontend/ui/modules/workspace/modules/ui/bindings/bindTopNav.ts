import { store } from "../../state/store.js";

export function bindTopNav(root: Element): void {
  const themeBtn = root.querySelector("[data-role='theme-toggle']") as HTMLButtonElement | null;
  const paletteSelect = root.querySelector("[data-role='palette-select']") as HTMLSelectElement | null;
  const unreadBadge = root.querySelector("[data-role='unread']") as HTMLElement | null;
  const userMenu = root.querySelector("[data-role='user-menu']") as HTMLElement | null;
  const userAvatar = root.querySelector("[data-role='user-avatar']") as HTMLElement | null;
  const userName = root.querySelector("[data-role='user-name']") as HTMLElement | null;
  const userDropdown = root.querySelector("[data-role='user-dropdown']") as HTMLElement | null;
  const logoutBtn = root.querySelector("[data-role='logout']") as HTMLButtonElement | null;
  const workspaceSelectBtn = root.querySelector("[data-role='workspace-select']") as HTMLButtonElement | null;

  // Load user info
  loadUserInfo(userAvatar, userName);

  // Theme toggle
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = store.getState().ui.theme.theme;
      const next = current === "light" ? "dark" : "light";
      store.dispatch({ type: "UI_SET_THEME", payload: { ...store.getState().ui.theme, theme: next } });
    });
  }

  // Palette select
  if (paletteSelect) {
    paletteSelect.addEventListener("change", () => {
      store.dispatch({
        type: "UI_SET_THEME",
        payload: { ...store.getState().ui.theme, palette: paletteSelect.value },
      });
    });
  }

  // User menu dropdown
  if (userMenu && userDropdown) {
    userMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = userDropdown.style.display !== "none";
      userDropdown.style.display = isVisible ? "none" : "block";
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      userDropdown.style.display = "none";
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/frontend/home.html";
    });
  }

  // Workspace select
  if (workspaceSelectBtn) {
    workspaceSelectBtn.addEventListener("click", () => {
      window.location.href = "/frontend/workspace-select.html";
    });
  }

  // Subscribe to state changes
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

async function loadUserInfo(avatarEl: HTMLElement | null, nameEl: HTMLElement | null): Promise<void> {
  const token = localStorage.getItem("catachess_token") || sessionStorage.getItem("catachess_token");
  if (!token) return;

  try {
    const response = await fetch("http://localhost:8000/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      const displayName = user.username || user.identifier;

      if (nameEl) {
        nameEl.textContent = displayName;
      }

      if (avatarEl) {
        const initial = displayName.charAt(0).toUpperCase();
        avatarEl.textContent = initial;
      }
    }
  } catch (error) {
    console.error("Failed to load user info:", error);
  }
}
