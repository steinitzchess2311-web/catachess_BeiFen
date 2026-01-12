import type { AppState, NodeItem } from "../../state/types.js";

export function renderTree(root: Element, state: AppState): void {
  const container = root.querySelector("[data-role='tree']") as HTMLElement | null;
  if (!container) return;

  const nodes = Object.values(state.nodes.byId);
  container.innerHTML = nodes.map((node) => renderTreeItem(node)).join("");
}

function renderTreeItem(node: NodeItem): string {
  return `
    <div class="tree-item" data-node-id="${node.id}" data-node-type="${node.type}">
      ${node.title}
    </div>
  `;
}
