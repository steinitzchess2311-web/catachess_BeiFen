import type { AppState } from "../../state/types.js";

export function renderDiscussions(container: Element, state: AppState): void {
  const list = container.querySelector("[data-role='discussions']") as HTMLElement | null;
  if (!list) return;
  const active = state.studies.active.studyId;
  const threads = active ? state.discussions.threadsByTargetId[active] || [] : [];
  list.innerHTML = threads
    .map(
      (thread) => `\n      <div class="discussion-item" data-thread-id="${thread.id}">\n        <div class="discussion-title">${thread.title}</div>\n        <div class="discussion-actions">\n          <button data-action="discussion-resolve" data-thread-id="${thread.id}" type="button">Resolve</button>\n          <button data-action="discussion-pin" data-thread-id="${thread.id}" type="button">Pin</button>\n          <button data-action="discussion-delete" data-thread-id="${thread.id}" type="button">Delete</button>\n        </div>\n        <textarea data-role="reply-content" placeholder="Reply"></textarea>\n        <button data-action="discussion-reply" data-thread-id="${thread.id}" type="button">Reply</button>\n      </div>\n    `\n    )\n    .join("");
}
