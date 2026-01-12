import { closeShareDialog } from "./acl.controller.js";

export function bindShareDialog(root: Element): void {
  const overlay = root.querySelector("[data-slot='overlay']") as HTMLElement;
  overlay.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target?.dataset?.action === "dialog-close") {
      closeShareDialog();
    }
  });
}
