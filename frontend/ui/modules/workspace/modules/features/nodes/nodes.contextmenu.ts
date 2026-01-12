import { createNodesController } from "./nodes.controller.js";

export function bindContextMenu(root: Element, baseUrl: string): void {
  const controller = createNodesController(baseUrl);

  root.addEventListener("contextmenu", async (event) => {
    const target = (event.target as HTMLElement).closest("[data-node-id]") as HTMLElement | null;
    if (!target) return;
    event.preventDefault();

    const action = window.prompt("Action: rename/delete/copy", "rename");
    if (!action) return;

    const nodeId = target.dataset.nodeId as string;
    const nodeType = target.dataset.nodeType as "workspace" | "folder" | "study";

    if (action === "rename") {
      const title = window.prompt("New name", "Untitled");
      if (!title) return;
      const typeMap = {
        workspace: "workspaces",
        folder: "folders",
        study: "studies",
      } as const;
      await controller.renameNode(typeMap[nodeType], nodeId, title);
    }

    if (action === "delete") {
      await controller.deleteNode(nodeId);
    }

    if (action === "copy") {
      await controller.copyNode(nodeId, null);
    }
  });
}
