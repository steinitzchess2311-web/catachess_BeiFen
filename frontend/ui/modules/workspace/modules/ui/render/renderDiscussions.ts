import type { AppState } from "../../state/types.js";

export function renderDiscussions(container: Element, state: AppState): void {
  const list = container.querySelector("[data-role='discussions']") as HTMLElement | null;
  if (!list) return;
  const active = state.studies.active.studyId;
  const threads = active ? state.discussions.threadsByTargetId[active] || [] : [];
  list.innerHTML = threads
    .map(
      (thread) => `
      <div class="discussion-item" data-thread-id="${thread.id}">
        <div class="discussion-title">${thread.title}</div>
        <div class="discussion-actions">
          <button data-action="discussion-resolve" data-thread-id="${thread.id}" type="button">Resolve</button>
          <button data-action="discussion-pin" data-thread-id="${thread.id}" type="button">Pin</button>
          <button data-action="discussion-delete" data-thread-id="${thread.id}" type="button">Delete</button>
        </div>
        <textarea data-role="reply-content" placeholder="Reply"></textarea>
        <button data-action="discussion-reply" data-thread-id="${thread.id}" type="button">Reply</button>
      </div>
    `
    )
    .join("");
}
