import { bindDragDrop } from "../../features/nodes/nodes.dragdrop.js";
import { bindContextMenu } from "../../features/nodes/nodes.contextmenu.js";

export function bindDesktop(root: Element): void {
  const baseUrl = window.location.origin;
  bindDragDrop(root, baseUrl);
  bindContextMenu(root, baseUrl);
}
