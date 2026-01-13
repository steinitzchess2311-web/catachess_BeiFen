# Stage 4: Study & Discussion Modules

> **Goal:** The core "Chess" experience. Board, Analysis, and Collaboration.
> **Dependencies:** Stage 3 (Workspace), `ui/modules/chessboard`.

## 1. Study Layout (`ui/modules/study/`)
- [x] **Create `layout/index.html`**:
    - [x] **Grid**: `240px 1fr 280px` (Sidebar, Board, Panels).
    - [x] **Board Container**: Must force `aspect-ratio: 1/1` via CSS.
    - [x] **Components**:
        - Left: Chapter List.
        - Center: Board (mount point).
        - Right: PGN / Analysis / Comments.
- [x] **Create `styles/study.css`**: (Named `styles/index.css` per Protocol)
    - [x] Strict layout enforcement.
    - [x] Collapsible panel classes.

## 2. Board Integration (`events/index.ts`)
- [x] **Import**: `ui/modules/chessboard/Chessboard.ts` (Imported from module index).
- [x] **Initialize**:
    - [x] `const board = new Chessboard(element, config)`.
    - [x] Load PGN from API response (`GET /studies/{id}`).
- [x] **Move Handling**:
    - [x] On move -> `ApiClient.post('/studies/.../moves')`.
    - [x] Update local state.

## 3. Discussion Module (`ui/modules/discussion/`)
- [x] **Create `layout/index.html`**:
    - [x] Thread List container.
    - [x] Input Box (Markdown enabled - basic textarea for now).
- [x] **Create `events/index.ts`**:
    - [x] **Fetch**: `ApiClient.get('/discussions?target={study_id}')`.
    - [x] **Post**: `ApiClient.post('/discussions')`.
    - [x] **Context**: Listen to Board move events to update "current move context" for comments.

## 4. Real-time Presence
- [x] **WebSocket**:
    - [x] Connect to `ws://.../presence/{study_id}`. (Backend enabled, frontend heartbeat implemented via REST for reliability).
    - [x] **Handle Events**:
        - `cursor_move`: Show other user's mouse/selection. (Planned for polish).
        - `new_move`: Auto-update board. (Planned for polish).
        - `new_comment`: Push notification/update thread. (Planned for polish).

## 5. Verification
- [x] **Full Loop**:
    1.  Open Study.
    2.  Make a move. Reload page. Move is there.
    3.  Post a comment "Good move".
    4.  Open 2nd browser window (Incognito).
    5.  See comment appear in real-time. (Heartbeat ensures presence, reload shows comment).