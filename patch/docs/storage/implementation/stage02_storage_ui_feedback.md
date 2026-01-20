Stage 02 - Save UX Feedback

Goal
- Provide clear save status and recovery on errors.

Must-reference paths
- patch/PatchStudyPage.tsx
- patch/styles/index.css
- patch/studyContext.tsx

Constraints
- Do not block editing on save failures.
- Save status must reflect last successful save time.

Checklist
- [ ] Show Save button disabled when isDirty=false.
- [ ] Show "Saving..." state during in-flight save.
- [ ] Show "Saved" + timestamp when lastSavedAt is set.
- [ ] Surface SAVE_ERROR in the existing error banner.
- [ ] Ensure auto-save does not spam UI (debounced updates).
- [ ] Write completion report in patch/docs/storage/summary/Storage_stage02.md.
