import { createNodesController } from "./nodes.controller.js";

export function bindDragDrop(root: Element, baseUrl: string): void {
  const controller = createNodesController(baseUrl);
  root.addEventListener("dragstart", (event) => {
    const target = event.target as HTMLElement;
    if (!target || !target.dataset.nodeId) return;
    event.dataTransfer?.setData("text/plain", target.dataset.nodeId);
  });

  root.addEventListener("dragover", (event) => {
    const target = event.target as HTMLElement;
    if (target && (target.closest("[data-role='nodes']") || target.closest("[data-role='tree']"))) {
      event.preventDefault();
    }
  });

  root.addEventListener("drop", async (event) => {
    const target = event.target as HTMLElement;
    const container = target?.closest("[data-role='nodes']") || target?.closest("[data-role='tree']");
    if (!container) return;
    event.preventDefault();
    const nodeId = event.dataTransfer?.getData("text/plain");
    if (!nodeId) return;
    await controller.moveNode(nodeId, null);
  });
}
