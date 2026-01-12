import type { AppState, NodeItem } from "../../state/types.js";

export function renderDesktop(root: Element, state: AppState): void {
  const container = root.querySelector("[data-role='nodes']") as HTMLElement | null;
  if (!container) return;

  const nodes = Object.values(state.nodes.byId).filter((node) => node.type !== "workspace");
  container.innerHTML = nodes.map((node) => renderNodeCard(node)).join("");
}

function renderNodeCard(node: NodeItem): string {
  return `
    <div class="node-card" data-node-id="${node.id}" data-node-type="${node.type}" draggable="true">
      <div class="node-card-title" data-role="title">${node.title}</div>
      <div class="node-card-meta" data-role="meta">${node.meta || node.type}</div>
    </div>
  `;
}
