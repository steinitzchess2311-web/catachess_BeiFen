import { store } from "../../state/store.js";

export function bindChapters(root: Element): void {
  const container = root.querySelector("[data-slot='study-chapters']") as HTMLElement | null;
  if (!container) return;

  container.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest("[data-chapter-id]") as HTMLElement | null;
    if (!target) return;
    const chapterId = target.dataset.chapterId as string;
    store.dispatch({ type: "STUDY_SET_ACTIVE", payload: { chapterId } });
  });
}
