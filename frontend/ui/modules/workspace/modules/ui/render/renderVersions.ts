import type { AppState } from "../../state/types.js";

export function renderVersions(container: Element, state: AppState): void {
  const list = container.querySelector("[data-role='versions']") as HTMLElement | null;
  if (!list) return;
  const active = state.studies.active.studyId;
  const versions = active ? state.studies.versionsByStudy[active] || [] : [];
  list.innerHTML = versions
    .map(
      (version) =>
        `<div class="version-item" data-version="${version.version}">v${version.version} ${version.summary || ""}</div>`
    )
    .join("");
}
