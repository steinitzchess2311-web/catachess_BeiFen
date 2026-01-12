# Catachess Issue Review

Scope: backend + frontend code scan with emphasis on correctness, security, and completeness.

## Critical
- ✅ `backend/modules/workspace/api/deps.py`: authentication trusts `Authorization: Bearer <user_id>` with no JWT validation or signature/expiry check, allowing trivial user impersonation across workspace endpoints.
- ✅ `backend/main.py`: CORS config allows `allow_origins=["*"]` while `allow_credentials=True`, which is both insecure and incompatible with browsers (credentials requests will fail or be blocked).
- ✅ `backend/routers/auth.py`: `/auth/register` accepts `role` from client input with no server-side restriction, so anyone can self-register as `teacher` and gain privileged access.

## High
- ✅ `backend/core/config.py`: insecure defaults committed in repo (hard-coded `DATABASE_URL`, default `JWT_SECRET_KEY`, `DEBUG=True`, and internal `ENGINE_URL`), risking credential leakage and unsafe production behavior if env overrides are missing.
- ✅ `backend/routers/auth.py`: no rate limiting or lockout on `/auth/login`, `/auth/register`, or `/auth/resend-verification`, enabling brute-force and enumeration attempts.
- ✅ `backend/core/security/current_user.py`: logs token prefixes and user identifiers on every request, increasing exposure of sensitive auth data in logs.
- ✅ `backend/services/signup_verification_service.py`: `mark_user_verified` is a no-op because `User` lacks an `is_verified` field; successful verification does not persist any verified state.
- ✅ `backend/modules/workspace/main.py`: same CORS misconfiguration as `backend/main.py` (`allow_origins=["*"]` + `allow_credentials=True`), which is insecure and browser-incompatible.
- ✅ `backend/modules/workspace/domain/services/search_service.py`: permission checks for discussion threads, replies, chapters, and annotations return `True` unconditionally, so search results can leak content from objects the user should not access.

## Medium
- ❓ `backend/modules/workspace/api/router.py`: omits `notifications`, `presence`, and `versions` routers, so those endpoints (used by frontend) are never mounted.
- ❓ `backend/modules/workspace/api/endpoints/presence.py`: dependencies are placeholders raising `NotImplementedError`, so presence REST endpoints are non-functional.
- ❓ `backend/modules/workspace/api/websocket/presence_ws.py`: `subscribe_to_presence_events` is a stub; WebSocket connections never receive presence events from the bus, and there is no auth/permission check on the socket.
- ❓ `backend/modules/workspace/api/endpoints/studies.py`: `create_study` only creates a node and skips creating a Study entity (TODO), leaving data model incomplete.
- ❓ `backend/modules/workspace/api/endpoints/versions.py`: version creation and rollback use hard-coded `user_id="user_test"` and placeholder snapshot content; audit data and snapshots are unreliable, and auth is missing.
- ❓ `backend/modules/workspace/domain/services/study_service.py`: auto-snapshot uses placeholder study data/chapters/variations/annotations; actual study state capture is missing.
- ❓ `backend/modules/workspace/jobs/snapshot_job.py`: periodic snapshots use placeholder study state; saved versions are not meaningful.
- ❓ `backend/modules/workspace/notifications/dispatcher.py`: email/push delivery is skipped (TODO); notifications effectively only work in-app and silently skip other channels.
- ❓ `backend/modules/workspace/notifications/aggregator.py`: `mark_digest_sent` is a no-op; digests cannot be tracked or de-duplicated.
- ✅ `backend/modules/workspace/events/subscribers/notification_creator.py`: dispatch exceptions are swallowed without logging, making delivery failures invisible.
- ❓ `backend/modules/workspace/main.py`: workspace API is mounted under `/api/v1/workspace`, but the frontend workspace code calls `/studies`, `/nodes`, `/notifications`, etc. at `window.location.origin` with no prefix, so requests will 404 unless a reverse proxy rewrites paths.
- ❓ `frontend/ui/modules/workspace/modules/api/endpoints.ts`: multiple endpoint/verb mismatches with backend routes, breaking core flows:
  - `WorkspaceApi` uses `/workspaces`, `/folders`, `/nodes/move`, `/nodes/copy`, and `/nodes/{id}` delete without `version`; backend expects `/nodes` (with `node_type`), `/nodes/{node_id}/move`, has no copy endpoint, and requires `version` for delete.
  - `StudyApi` uses `/studies/{id}/chapters`, `/studies/{id}/import-pgn`, `/studies/{id}/export`, `/export-jobs/{id}`, and `/study/*` paths for moves/annotations/variations; backend uses `/studies/{id}` (chapters inlined), `/studies/import-pgn`, `/studies/{id}/pgn/export/*`, and `/studies/{id}/chapters/{chapter_id}/...` for moves/annotations/variations.
  - `StudyApi.rollback` sends `{ version }` but backend expects `{ target_version }`.
  - `DiscussionApi.listDiscussions` uses `target` query param only; backend requires `target_id` + `target_type`.
  - `DiscussionApi.resolveThread/pinThread` use `POST`, but backend expects `PATCH`.
  - `DiscussionApi.editReply/deleteReply` use `/discussions/replies/{id}`; backend exposes `/replies/{id}` with no `/discussions` prefix.
  - `NotificationApi.markRead/dismiss` use `/notifications/{id}/read` and `/notifications/{id}/dismiss`; backend exposes `/notifications/read` (batch) and `DELETE /notifications/{id}`.
- ❓ `frontend/ui/modules/workspace/modules/api/endpoints.ts`: `UserApi.search` calls `GET /users`, but there is no backend `/users` endpoint, so user lookup will 404.
- ❓ `frontend/ui/modules/workspace/modules/realtime/subscriptions.ts`: expects a workspace events WebSocket at `/events?scope=workspace:{id}`, but the backend has no events WebSocket endpoint; presence WS (`/ws/presence`) exists but is not mounted in the workspace API router.
- ❓ `frontend/ui/modules/workspace/modules/api/client.ts`: always calls `response.json()`; 204 responses from delete endpoints (`/nodes/{id}`, `/discussions/{id}`, `/replies/{id}`, `/notifications/{id}`) will throw and break UI flows.
- ❓ `frontend/ui/modules/workspace/modules/state/reducers.ts`: session token is read for API auth, but there is no code in the workspace frontend setting `SESSION_SET`, so requests likely go out unauthenticated and fail with 401.

## Low
- ❓ `backend/core/tagger/facade.py`: CoD metrics use placeholder `threat_delta`, `current_ply`, and `last_cod_ply`, so tag accuracy is incomplete.
- ❓ `backend/core/tagger/pipeline/stages.py`: `coverage` metrics are stubbed to zeros, leaving coverage-related tags untrustworthy.
- ❓ `backend/core/tagger/detectors/cod_v2/gates.py`: `tactical_weight` is TODO, reducing detection fidelity.
- ❓ `backend/core/tagger/chessortag.md` and `backend/core/tagger/config/priorities.py`: incomplete tag implementations (e.g., `mate_threat`, `coverage_delta`, `structural_blockage`) are documented as TODO, indicating gaps in tagger feature coverage.
- ❓ `frontend/ui/modules/games/modules/ui/events.ts`: core gameplay interactions are placeholders (takeback, extra menu, square selection, move making, chat input), leaving the game UI functionally incomplete.
- ❓ `frontend/ui/modules/games/README.md`: lists key gameplay features as placeholders, matching the incomplete UI implementation.
- ❓ `frontend/ui/modules/games/modules/core/config.ts`: game API/WS endpoints are hard-coded to a production host; local/dev runs will silently target production unless `VITE_API_BASE`/`VITE_WS_BASE` are set.
