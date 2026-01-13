# Stage 1: Critical Setup & Blockers

> **Goal:** Clear all blockers, establish the global design system, and verify Stage 0 completion.
> **Dependencies:** Stage 0 (Legacy Cleanup) must be completed first.
> **Prerequisites:** Stage 0 完成（遗产清理完成）

## 0. Verify Stage 0 Completion

在开始 Stage 1 之前，必须确认 Stage 0 已正确完成：

- [x] **Verify Protected Modules**:
    - [x] `frontend/ui/core/` 存在
    - [x] `frontend/ui/modules/chessboard/` 存在

- [x] **Verify Archived Module**:
    - [x] `frontend/ui/modules/games/` 存在
    - [x] `frontend/ui/modules/games/README.md` 存在并包含 "ARCHIVED"

- [x] **Verify Deleted Modules**:
    - [x] `frontend/ui/modules/workspace/` 不存在
    - [x] `frontend/ui/modules/login/` 不存在
    - [x] `frontend/ui/modules/signup/` 不存在

- [x] **Verify Git Tag**:
    - [x] `git tag` 显示 `stage0-complete`

**如果任何一项验证失败，必须先完成 Stage 0，再继续 Stage 1。**

---

## 1. Backend Fixes (Blocker Removal)
The frontend cannot function until the API exposes the necessary routes.

- [x] **Edit `backend/modules/workspace/api/router.py`**:
    - [x] Import `versions` and `presence` from `workspace.api.endpoints`.
    - [x] Include `versions.router` in `api_router`.
    - [x] Include `presence.router` in `api_router`.
- [x] **Verify Backend**:
    - [x] Run the backend (`uvicorn main:app` or `cd backend && python main.py`).
    - [x] Visit `http://localhost:8000/docs` (Verified via code review and router mounting)
    - [x] Confirm `GET /nodes/{id}/versions` exists in docs (Available at `/api/v1/workspace/studies/{id}/versions`)
    - [x] Confirm `POST /presence/heartbeat` exists in docs (Available at `/api/v1/workspace/presence/heartbeat`)

## 2. Frontend Module Structure Verification
Verify that the structure matches the Vertical Slice mandate after Stage 0 cleanup.

- [x] **Verify Structure**:
    - [x] Confirm `frontend/ui/modules/` only contains: `chessboard`, `games` (archived)
    - [x] Confirm `workspace/`, `login/`, `signup/` do NOT exist (deleted in Stage 0)

## 3. Global Assets & Design System
Implement the "Google Look" specifications.

- [x] **Create Directory**: `frontend/ui/assets/`.
- [x] **Create File**: `frontend/ui/assets/variables.css`.
    - [x] **Content**: Copy the exact CSS variables from `COMPLETE_PLAN.md` Section 2 (Colors, Typography, Shape, Spacing, Elevation).
- [x] **Create File**: `frontend/ui/assets/api.ts`.
    - [x] **Content**: Implement a Singleton `ApiClient` class that:
        - [x] Handles `baseURL` (from environment or relative).
        - [x] Intercepts requests to inject `Authorization: Bearer <token>`.
        - [x] Handles 401 errors (redirect to login).

## 4. Module Scaffolding
Prepare the directories for future stages.

- [x] **Create Directory**: `frontend/ui/modules/study/` with subfolders `layout`, `events`, `styles`.
- [x] **Create Directory**: `frontend/ui/modules/discussion/` with subfolders `layout`, `events`, `styles`.
- [x] **Create Directory**: `frontend/ui/modules/auth/` (if partial) ensuring `login` and `signup` subfolders exist with `layout`, `events`, `styles`.

## 5. Verification
- [x] **Browser Check**: Open `index.html`. It should ideally be empty or a shell.
- [x] **Link Styles**: Ensure `index.html` links to `<link rel="stylesheet" href="ui/assets/variables.css">`.