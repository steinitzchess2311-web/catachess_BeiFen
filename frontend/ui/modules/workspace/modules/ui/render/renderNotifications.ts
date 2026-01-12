import type { AppState } from "../../state/types.js";

export function renderNotifications(container: Element, state: AppState): void {
  const list = container.querySelector("[data-role='notifications']") as HTMLElement | null;
  if (!list) return;
  list.innerHTML = state.notifications.items
    .map(
      (item) =>
        `<div class="notification-item" data-notification-id="${item.id}">${item.message}
          <button data-action="notification-read" data-notification-id="${item.id}" type="button">Read</button>
          <button data-action="notification-dismiss" data-notification-id="${item.id}" type="button">Dismiss</button>
        </div>`
    )
    .join("");
}
