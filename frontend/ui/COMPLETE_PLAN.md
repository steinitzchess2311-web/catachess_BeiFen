# Catachess Frontend Reconstruction Plan (Final Specs)

> **Author:** Senior Product Manager (Ex-Google Design/Eng)
> **Date:** 2026-01-12
> **Status:** FINAL APPROVED VERSION
> **Strict Mandate:** Preserve `ui/core` and `ui/modules/chessboard`. Use Vertical Slice with sub-folders (`layout/`, `events/`, `styles/`).

---

## 0. 🚨 URGENT Backend Fixes (Blockers)

The frontend **cannot function** without these backend routes. Fix these first.

1.  **Mount `Versions` & `Presence` Routers:**
    *   **File:** `backend/modules/workspace/api/router.py`
    *   **Action:** Add `from workspace.api.endpoints import versions, presence` and include them in `api_router`.
    *   **Why:** `study.html` relies on these for history and real-time collaboration.

---

## 1. 📂 GLOBAL FILE STRUCTURE

Strict Vertical Slice with sub-folders. Anything else must be purged.

```text
frontend/
├── index.html                  # Shell + Auth Router
├── ui/
│   ├── assets/                 # variables.css (Material 3), api.ts (Singleton)
│   ├── core/                   # [PRESERVED] Window Management (drag, focus, resize, etc.)
│   └── modules/
│       ├── chessboard/         # [PRESERVED] Chess logic & rendering
│       ├── auth/
│       │   ├── login/          # layout/, events/, styles/
│       │   └── signup/         # layout/, events/, styles/ (Includes Verification)
│       ├── workspace/          # layout/, events/, styles/
│       ├── study/              # layout/, events/, styles/ (Board + Chapters + PGN)
│       └── discussion/         # layout/, events/, styles/ (Shared Component)
```

---

## 2. 🛡️ MODULE: AUTH -> SIGNUP (`ui/modules/auth/signup/`)

**Workflow:** 2-Step Authentication Flow.

### 🎨 Design Specs
*   **Step 1 (Register):** Email, Username, Password.
*   **Step 2 (Verify):** 6-digit code input, Resend link with 60s timer.

### ⚡ Events & Logic (`events/index.ts`)

| Action | Trigger | UI State | Backend Path | Logic Detail |
| :--- | :--- | :--- | :--- | :--- |
| **Register** | Submit Form | Disable btn, show spinner | `POST /auth/register` | If success -> `showStep(2)`, `startTimer()`. Store email in memory. |
| **Verify** | Input 6 chars | Overlay loading | `POST /auth/verify-signup` | Send `{ identifier: email, code: code }`. Success -> Redirect to Login. |
| **Resend** | Click Link | Disable link for 60s | `POST /auth/resend-verification` | Send `{ identifier: email }`. Restart 60s countdown. |

---

## 3. 💬 MODULE: DISCUSSION (`ui/modules/discussion/`)

**Concept:** A context-aware panel that slides in from the right or appears in a designated `.comment-box`.

### 🎨 Design Specs
*   **Layout:** Vertical thread list. Avatars (40px), Markdown content, Reply links.
*   **Integration:** In `study.html`, it lives in the `.comment-box`. In `folder.html`, it is toggled via the `.discussion-toggle`.

### ⚡ Events & Logic (`events/index.ts`)

| Action | Trigger | Backend Path | Logic Detail |
| :--- | :--- | :--- | :--- |
| **Load** | Toggle Open | `GET /discussions?target={id}` | Fetches threads. Recursively renders replies (max 5 depth). |
| **Post** | Click "Send" | `POST /discussions` | Creates a new thread at the current context (Study/Chapter/Move). |
| **Reply** | Click "Reply" | `POST /discussions/{tid}/replies` | Posts a reply to a specific thread or parent reply. |
| **React** | Click Emoji | `POST /reactions` | Optimistic UI: Update count immediately, then send `{ target_id, emoji }`. |

---

## 4. ♟️ MODULE: STUDY (`ui/modules/study/`)

**Concept:** Highly adjustable layout with a **Forced Square Board**.

### 🎨 Design Specs
*   **Proportions:** Managed via `grid-template-columns: 240px 1fr 280px`.
*   **The Board:** `aspect-ratio: 1/1` constraint. Must remain square regardless of window size.
*   **Visibility:** All panels (Chapters, PGN, Sidebar) have `.hide-btn`.

### ⚡ Events & Logic (`events/index.ts`)

| Action | Trigger | UI Interaction | Logic Detail |
| :--- | :--- | :--- | :--- |
| **Toggle UI** | Click `.hide-btn` | Animate width to 0 | Collapse/Expand panels. Adjust grid columns dynamically. |
| **Move** | Drag on Board | `POST /studies/.../moves` | Update PGN tree. Trigger **Discussion** context update to current move. |
| **Init** | Page Load | `GET /studies/{id}` | Hydrate Board, Chapters, and PGN. Trigger **Presence** heartbeat. |

---

## 5. 🗂️ MODULE: WORKSPACE (`ui/modules/workspace/`)

### ⚡ Events & Logic (`events/index.ts`)

| Action | Trigger | Backend Path | Logic Detail |
| :--- | :--- | :--- | :--- |
| **List** | Init / Navigate | `GET /nodes?parent_id={id}` | Renders Folders and Studies. |
| **Create** | "Add" buttons | `POST /nodes` | Type `workspace`, `folder`, or `study`. |

---

## 6. 💻 DEVELOPER GUIDELINES

1.  **Strict Layout Separation:** No HTML strings in `events/index.ts`. Use `<template>` elements from `layout/index.html`.
2.  **Core Usage:** When building the "New Folder" popup, **MUST** use `ui/core/drag` and `ui/core/focus` to make it a proper draggable window.
3.  **Styles:** All sizing MUST use variables from `assets/css/variables.css`. No hardcoded hex codes.