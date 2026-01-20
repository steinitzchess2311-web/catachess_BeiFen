Stage 01 - Save Entry + Auto-save

Goal
- Add save entrypoint and auto-save with debounce when tree changes.

Must-reference paths
- Frontend: patch/studyContext.tsx, patch/PatchStudyPage.tsx, patch/sidebar/movetree.tsx
- Backend API: patch/backend/study/api.py

Constraints
- Only tree.json is persisted.
- No FEN in tree.json.
- Auto-save only when isDirty=true.

Checklist
- [ ] Add isDirty + lastSavedAt to StudyState.
- [ ] Set isDirty=true on ADD_MOVE and DELETE_MOVE.
- [ ] Add saveTree() in StudyProvider to call PUT /study-patch/chapter/{chapter_id}/tree.
- [ ] Auto-save useEffect with debounce (10–30s) or idle timeout.
- [ ] Manual Save button triggers saveTree().
- [ ] On success: isDirty=false, lastSavedAt=now.
- [ ] On failure: set SAVE_ERROR, keep isDirty=true.
- [ ] Write completion report in patch/docs/storage/summary/Storage_stage01.md.
