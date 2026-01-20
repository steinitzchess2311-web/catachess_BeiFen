Storage System Plan (Patch)

Goal
- Add manual Save + auto-save for Study tree.json stored in R2.
- Only save when there are changes, with debounce/idle protection.

Scope
- Frontend: Patch Study UI + StudyContext.
- Backend: existing tree.json PUT endpoint (no new storage format).

Constraints
- tree.json is the only persisted structure.
- No FEN in tree.json.
- Save uses existing PUT /study-patch/chapter/{chapter_id}/tree.

Milestones
- Stage 01: Frontend state + Save entrypoint (manual + auto-save).
- Stage 02: Save feedback + error handling + UX indicators.
- Stage 03: Optional concurrency guard (hash/updatedAt) and observability.

Success Criteria
- Manual Save writes to R2 and clears dirty flag.
- Auto-save triggers only when isDirty=true and after debounce/idle.
- Failures surface as SAVE_ERROR and do not clear dirty flag.
