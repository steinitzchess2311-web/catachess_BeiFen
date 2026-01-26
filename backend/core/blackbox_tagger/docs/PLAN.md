# Blackbox Tagger Integration Plan

Goal: Add a swappable blackbox tagger implementation (rule_tagger2) while preserving the current API/response schema and enabling one-line switching in `backend/core/tagger/facade.py`.

## Scope
- No behavior changes for the frontend or API surface.
- No changes to response schema (must remain `TagResult` compatible).
- Provide a seamless switch between split tagger and blackbox tagger by changing a single import line.

## Target File Layout
- `backend/core/tagger/facade.py`
  - Single export of `tag_position` via one-line import.
  - Switch by editing one line (split vs blackbox).
- `backend/core/tagger/facade_split.py`
  - Contains the current split implementation (existing facade logic moved here).
- `backend/core/tagger/core/blackbox_tagger/__init__.py`
  - Exports `tag_position` from adapter.
- `backend/core/tagger/core/blackbox_tagger/adapter.py`
  - Handles import of rule_tagger2 and adapts output to current `TagResult` schema.
- `backend/core/tagger/core/blackbox_tagger/path.py` (optional)
  - Injects blackbox path into `sys.path` via `BLACKBOX_TAGGER_PATH` env var.

## Inputs/Outputs (Contract)
- Input parameters: keep same signature as current `tag_position`.
- Output: instance compatible with `backend/core/tagger/tag_result.TagResult`.
- Any blackbox-only fields must be ignored or mapped into `analysis_context` safely.

## Detailed Steps
### 1) Snapshot current facade API
- Record the exact signature of `backend/core/tagger/facade.py: tag_position`.
- Ensure all current callers still import from `backend/core/tagger/facade.py`.

### 2) Split current facade implementation
- Create `backend/core/tagger/facade_split.py`.
- Move existing logic from `backend/core/tagger/facade.py` into `facade_split.py`.
- Keep `tag_position` signature unchanged.

### 3) Add blackbox adapter
- Create `backend/core/tagger/core/blackbox_tagger/adapter.py` with:
  - `def tag_position(...):` (same signature as split).
  - Optional `BLACKBOX_TAGGER_PATH` env lookup.
  - `sys.path` injection if path provided.
  - `from rule_tagger2.core.facade import tag_position as bb_tag_position`.
  - Call `bb_tag_position(...)` with matching params.
  - Adapt/normalize the result into current `TagResult` schema.

### 4) Schema adaptation rules
- If blackbox returns TagResult-compatible object:
  - Validate required fields exist (or patch with defaults).
- If blackbox returns dict/other object:
  - Map expected fields into new `TagResult`.
- Ensure all boolean tags default to False if missing.
- Preserve `analysis_context` and `notes` when present.

### 5) One-line switch in facade
- `backend/core/tagger/facade.py` becomes:
  - `from .facade_split import tag_position`  (default)
  - or `from .core.blackbox_tagger import tag_position`
- This is the only line a developer changes to switch implementations.

### 6) Add minimal guards/logging
- Log which tagger implementation is active.
- If blackbox import fails, raise a clear error pointing to missing path or deps.

### 7) Verification
- Run a small smoke test calling `tag_position` with both implementations.
- Confirm the returned object can be consumed by existing pipeline (`tagging/get_primary_tags`).
- Compare tag lists between split and blackbox on a small PGN set.

## Non-goals
- No front-end changes.
- No refactor of detectors or rules.
- No schema expansion.

## Risks & Mitigations
- Import conflicts: isolate via `BLACKBOX_TAGGER_PATH` and avoid global state.
- Output mismatch: enforce adapter-based normalization into `TagResult`.
- Performance differences: acceptable for now; can optimize later if needed.

## Acceptance Criteria
- Single-line import switch in `backend/core/tagger/facade.py` toggles implementation.
- Both implementations return `TagResult`-compatible results.
- No changes required for frontend or API consumers.
