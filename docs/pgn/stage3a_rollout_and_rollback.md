# Stage 3A Execution: Rollout and Rollback

## Frontend flag verification
- File: `frontend/ui/modules/study/api/pgn.ts`
- Default: `USE_SHOW_DTO` returns `false` when no localStorage flag is present.
- Toggle: `toggleShowDTO()` flips `localStorage.catachess_use_show_dto`.
- Enable command (internal): `localStorage.setItem('catachess_use_show_dto', 'true')`
- Disable command: `localStorage.setItem('catachess_use_show_dto', 'false')`
- Runtime validation: pending (requires browser console access).

## Backend flag verification
- File: `backend/core/config.py`
- Flag: `PGN_V2_ENABLED` default `False`.
- Guards:
  - `/show` in `backend/modules/workspace/api/endpoints/studies.py`
  - `/fen` in `backend/modules/workspace/api/endpoints/studies.py`
- Behavior: returns 404 when flag disabled.
- Runtime validation: pending (requires running API server).

## Rollback checklist (validated in code)
- Frontend rollback: remove or set `catachess_use_show_dto` to `false`.
- Backend rollback: set `PGN_V2_ENABLED=false` and `/show` + `/fen` return 404.
- Legacy sync: `pgn_sync_service.sync_chapter_pgn_legacy()` path used when flag is off.

## Grey rollout scope
- Only internal/whitelisted testers enable the localStorage flag.
- Default remains disabled unless explicitly toggled.
