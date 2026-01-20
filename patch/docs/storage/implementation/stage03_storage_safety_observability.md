Stage 03 - Safety + Observability

Goal
- Add lightweight concurrency guard and logging for saves.

Must-reference paths
- patch/studyContext.tsx
- patch/backend/study/api.py
- patch/docs/storage/overview_plan.md

Constraints
- Keep tree.json schema unchanged (no new required fields).

Checklist
- [ ] Add optional client-side hash/etag to avoid accidental overwrite (best-effort).
- [ ] Log save attempts and outcomes (frontend console or backend logger).
- [ ] Ensure retry after failure keeps dirty flag.
- [ ] Document any trade-offs in summary.
- [ ] Write completion report in patch/docs/storage/summary/Storage_stage03.md.
