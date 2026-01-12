export function bindSidebar(root: Element): void {
  const sidebar = root.querySelector("[data-component='leftsidebar']") as HTMLElement | null;
  if (!sidebar) return;

  sidebar.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (!target?.dataset?.tab) return;
    const content = sidebar.querySelector("[data-role='content']") as HTMLElement | null;
    if (!content) return;
    content.textContent = `Tab: ${target.dataset.tab}`;
  });
}
