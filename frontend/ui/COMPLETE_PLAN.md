# Catachess Frontend Reconstruction Plan (Detailed Specs)

> **Author:** Senior Product Manager (Ex-Google Design/Eng)
> **Date:** 2026-01-12
> **Status:** APPROVED FOR IMPLEMENTATION
> **Audience:** UI Designers & Frontend Engineers

---

## 🛑 EXECUTIVE SUMMARY & RULES

1.  **Zero-Ambiguity Rule:** If it's not in this doc, ask. Do not guess.
2.  **Vertical Slice Architecture:** Every feature module (`auth`, `workspace`, `study`) is a self-contained island with `layout/`, `events/`, and `styles/`.
3.  **Core Preservation:** `frontend/ui/core/` and `frontend/ui/modules/chessboard/` are **SACRED**. Do not modify them; **USE** them.
4.  **Backend alignment:** All API calls are pre-validated against the backend implementation status.

---

## 0. 🚨 BLOCKERS (Backend Team Action Items)

**Priority 0:** The frontend cannot be built until these 3 lines of code are added to `backend/modules/workspace/api/router.py`.

```python
# In backend/modules/workspace/api/router.py

# 1. Import missing endpoints
from workspace.api.endpoints import versions, presence

# 2. Mount them
api_router.include_router(versions.router)
api_router.include_router(presence.router)
```

---

## 1. 📂 GLOBAL FILE STRUCTURE

The filesystem must look **EXACTLY** like this. Delete anything else.

```text
frontend/
├── index.html                  # <script> checks localStorage 'token' ? redirect('/workspace') : redirect('/home')
├── ui/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── variables.css   # :root { --primary: #1A73E8; --surface: #FFF; ... }
│   │   │   ├── reset.css       # box-sizing: border-box; margin: 0;
│   │   │   └── global.css      # body { font-family: 'Google Sans'; background: var(--bg); }
│   │   └── js/
│   │       ├── api.ts          # Singleton class ApiClient { request(method, url, body) ... }
│   │       └── utils.ts        # Common formatters (date, time)
│   │
│   ├── core/                   # [PRESERVED] Window Management System
│   │   ├── drag/
│   │   ├── focus/
│   │   ├── pointer/
│   │   ├── resize/
│   │   ├── scroll/
│   │   └── utils/
│   │
│   └── modules/
│       ├── chessboard/         # [PRESERVED] Chess Logic
│       │
│       ├── auth/               # Login & Signup
│       │   ├── login/          # Sub-module
│       │   │   ├── layout/index.html
│       │   │   ├── events/index.ts
│       │   │   └── styles/index.css
│       │   └── signup/         # Sub-module
│       │       ├── layout/index.html
│       │       ├── events/index.ts
│       │       └── styles/index.css
│       │
│       ├── home/               # Landing Page
│       │   ├── layout/index.html
│       │   ├── events/index.ts
│       │   └── styles/index.css
│       │
│       ├── workspace/          # File Browser
│       │   ├── layout/index.html
│       │   ├── events/index.ts
│       │   └── styles/index.css
│       │
│       └── study/              # Chess Interface
│           ├── layout/index.html
│           ├── events/index.ts
│           └── styles/index.css
```

---

## 2. 🔌 API CLIENT SPECIFICATION (`ui/assets/js/api.ts`)

**Goal:** A "stupid" client that handles the repetitive stuff.

*   **Class:** `ApiClient`
*   **Method:** `request(method: string, endpoint: string, body?: any)`
*   **Logic:**
    1.  Read `token` from `localStorage`.
    2.  Set Header: `Authorization: Bearer ${token}`.
    3.  Set Header: `Content-Type: application/json`.
    4.  Prefix URL: `/api/v1` + `endpoint`.
    5.  **Fetch.**
    6.  If status `401` (Unauthorized) -> `window.location.href = '/ui/modules/auth/login/layout/index.html'`.
    7.  Return `response.json()`.

---

## 3. 🛡️ MODULE: AUTH (`ui/modules/auth/`)

### A. Sub-module: Login (`auth/login`)

#### 🎨 Design Specs (The Look)
*   **Layout:** Centered Card (400px width) on a gray background (`#F0F2F5`).
*   **Typography:** Header "Sign In" (24px, medium), Label (12px, gray), Input Text (16px).
*   **Components:**
    *   2 x `input` fields (Email, Password) with outlined style (border `#DADCE0`, focus `#1A73E8`).
    *   1 x `button` (Primary Blue, 100% width, height 40px).
    *   1 x Link "Create account" (centered below).

#### ⚡ Events & Logic (`events/index.ts`)

| Event | Trigger | UI Feedback | Backend Path | Payload | Success Action | Error Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Submit Login** | Click "Sign In" or Enter key | Button disables, text becomes "Loading..." | `POST /auth/access-token` | `FormData` (username=email, password=pw) | 1. `localStorage.setItem('token', resp.access_token)`<br>2. Redirect to `/index.html` | Show red error toast: "Invalid credentials" |
| **Go to Signup** | Click "Create account" | None | N/A | N/A | Redirect to `../signup/layout/index.html` | N/A |

### B. Sub-module: Signup (`auth/signup`)

#### 🎨 Design Specs
*   **Layout:** Same as Login.
*   **Fields:** Email, Username, Password, Confirm Password.

#### ⚡ Events & Logic (`events/index.ts`)

| Event | Trigger | UI Feedback | Backend Path | Payload | Success Action | Error Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Submit Reg** | Click "Register" | Loading spinner | `POST /auth/register` | `{ email, password, full_name }` | 1. Auto-login (call token endpoint)<br>2. Redirect to `/index.html` | Show error toast (e.g. "Email exists") |

---

## 4. 🏠 MODULE: HOME (`ui/modules/home/`)

#### 🎨 Design Specs
*   **Layout:**
    *   **Navbar:** Transparent. Logo left. "Login" (Ghost button) right.
    *   **Hero:** Center text "Master Your Chess". Subtext "Organize, Analyze, Learn".
    *   **CTA:** Big Blue Button "Get Started".

#### ⚡ Events & Logic (`events/index.ts`)

| Event | Trigger | UI Feedback | Backend Path | Payload | Success Action | Error Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Get Started** | Click Button | Ripple effect | N/A | N/A | Check Token.<br>If valid -> `/ui/modules/workspace/layout/index.html`<br>Else -> `/ui/modules/auth/login/layout/index.html` | N/A |

---

## 5. 🗂️ MODULE: WORKSPACE (`ui/modules/workspace/`)

**Concept:** A Google Drive-like file browser.

#### 🎨 Design Specs
*   **Layout:**
    *   **Sidebar (Left, 250px):** Tree view of folders. Active state highlight (`#E8F0FE` + Blue text).
    *   **Main (Flex Grow):**
        *   **Toolbar:** Breadcrumbs (`Workspace > Opening > Sicilian`) + "New" Dropdown.
        *   **Grid:** Cards (200x150px). Icon (Folder/Board) + Title + Last Modified.
*   **Styles:** `gap: 16px`, `padding: 24px`.

#### ⚡ Events & Logic (`events/index.ts`)

| Event | Trigger | UI Feedback | Backend Path | Payload | Success Action | Error Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Init** | Page Load | Skeleton loaders on grid | `GET /nodes` | `?parent_id={currentId}` | Render Cards (Folder vs Study icons) | Show "Network Error" |
| **Nav: Down** | Click Folder Card | URL updates `?folder={id}` | `GET /nodes` | `?parent_id={clickedId}` | Clear grid, Render new children, Update Breadcrumbs | N/A |
| **Nav: Up** | Click Breadcrumb | URL updates | `GET /nodes` | `?parent_id={ancestorId}` | Clear grid, Render ancestor children | N/A |
| **Open Study** | Click Study Card | N/A | N/A | N/A | Redirect: `/ui/modules/study/layout/index.html?id={studyId}` | N/A |
| **Create Folder** | Toolbar > New Folder | Open Modal (Prompt) | `POST /nodes` | `{ "node_type": "folder", "title": "Name", "parent_id": "{currentId}" }` | Add new card to grid immediately (Optimistic UI) | Remove card, show error |
| **Create Study** | Toolbar > New Study | Open Modal (Prompt) | `POST /studies` | `{ "title": "Name", "parent_id": "{currentId}" }` | Add new card to grid | Remove card, show error |
| **Delete** | Right-click > Delete | Fade out card | `DELETE /nodes/{id}` | N/A | Remove element from DOM | Restore element (Undo) |

---

## 6. ♟️ MODULE: STUDY (`ui/modules/study/`)

**Concept:** A powerful chess IDE. This module **integrates EVERYTHING** (`chessboard`, `core` panels, backend).

#### 🎨 Design Specs
*   **Layout:**
    *   **Left (Sidebar):** Chapter List (Vertical list).
    *   **Center:** The Board (Responsive).
    *   **Right (Tools):** Tabbed Panel (Chat, Notation, Engine).
*   **Core Integration:** The Right Panel is NOT a static div. It is a `ui/core` **Panel**.
    *   `createPanel({ draggable: true, snap: 'right', ... })`.

#### ⚡ Events & Logic (`events/index.ts`)

| Event | Trigger | Backend Path | Payload | Logic Detail |
| :--- | :--- | :--- | :--- | :--- |
| **Init** | Page Load | `GET /studies/{id}` | N/A | 1. Fetch Study/Chapters.<br>2. Call `createChessboard(domElement)`.<br>3. Load PGN of first chapter into board.<br>4. Connect WebSocket. |
| **Move Piece** | User drags piece | `POST /studies/.../moves` | `{ "san": "e4", "chapter_id": "..." }` | 1. **Chessboard Module** validates legal move locally.<br>2. If legal, update board state.<br>3. Send API req.<br>4. If API fails, rollback board. |
| **Change Chapter** | Click Sidebar Item | N/A | N/A | 1. Load new PGN into Chessboard.<br>2. Update URL `?chapter={id}`. |
| **Presence** | Every 5s (Timer) | `POST /presence/heartbeat` | `{ "study_id": "...", "cursor": "e4" }` | Keep user "Online" in the right panel list. |
| **Undo/Rollback** | Click "Version History" | `GET /studies/{id}/versions` | N/A | Show list in a Modal. Clicking a version calls `POST /rollback`. |

---

## 7. 💻 DEVELOPER WORKFLOW (How to implement)

1.  **Backend Check:** Verify `router.py` changes.
2.  **Scaffold:** Run `mkdir -p` for all folders in Section 1.
3.  **Foundation:** Write `api.ts` first. Nothing works without it.
4.  **Auth:** Implement Login. Verify you can get a token.
5.  **Workspace:** Implement "Read" (List nodes). Then "Write" (Create).
6.  **Study:**
    *   Get the Board on screen (using `chessboard` module).
    *   Get the Panels on screen (using `core` module).
    *   Wire up the PGN loading.

**Do not deviate.** This is the blueprint.
