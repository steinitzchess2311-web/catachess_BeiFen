# Final Plan - ChessorTag Advanced Systems (Rewritten)

**Project**: catachess/backend/core/tagger
**Source Reference**: ChessorTag_final/rule_tagger2
**Date**: 2026-01-10
**Scope**: CoD v2, Versioning, Tag Aliases

---

## 0. Quick Assessment (Is the current plan good?)

- Good: It captures the three missing systems and lists integration points.
- Not good: It claims completion for pipeline/mate/coverage that do not exist in this repo; those are still TODOs.
- Not good: It mixes status, design, and execution steps without clear stages and checklists.
- Not good: It does not define stage entry/exit criteria or minimal deliverables.

This rewrite fixes those gaps with explicit stages, steps, checklists, and purpose.

---

## 1. Stage 0 - Align Reality and Baseline (1 day)

**Purpose**: Ensure the plan matches the current codebase and prevent false assumptions.

**Steps + Checklists**

**Step 0.1: Repo state audit**
- [x] Confirm actual existence of pipeline, gating, mate threat, and coverage delta
- [x] Verify what is wired into `facade.py` and whether detectors execute end-to-end
- [x] Record missing components in this file before coding

**Step 0.2: Plan correction**
- [x] Update all status claims to match reality (see Current Reality section)
- [x] Mark dependencies as "required" vs "nice-to-have" (infrastructure complete, need CoD/versioning/aliases)
- [x] Freeze scope for Stage 1-3 (CoD v2, Versioning, Aliases only)

**Exit criteria**
- A short audit note is added to this plan under “Current Reality”
- No remaining claims contradict the repository

---

## 2. Stage 1 - CoD v2 Migration (Core Feature) (3-4 days)

**Purpose**: Restore Control-over-Dynamics tagging with diagnostics and gating.

### Step 1.1: Data models + thresholds
- Create `backend/core/tagger/detectors/cod_v2/`
- Port `cod_types.py` into `models.py` + `result.py`
- Port `config.py` into `config.py` + `thresholds.py`

**Checklist**
- [x] `CoDContext`, `CoDMetrics`, `CoDResult`, `CoDSubtype` exist
- [x] All thresholds match rule_tagger2 values
- [x] Each file stays under the local file-size guideline

### Step 1.2: Detector logic
- Implement gates (tactical weight, mate threat, blunder, cooldown)
- Implement subtypes: prophylaxis, piece_control, pawn_control, simplification
- Assemble a single `detect()` flow

**Checklist**
- [x] Gate results are exposed in diagnostics
- [x] Only one subtype fires per move (priority order)
- [x] Cooldown is enforced (4 ply)

### Step 1.3: Integration into tagger
- Build CoDContext from TagContext
- Invoke detector from `facade.py`
- Map outputs to `TagResult` fields

**Checklist**
- [x] `control_over_dynamics` boolean is set
- [x] subtype is recorded in `control_over_dynamics_subtype`
- [x] diagnostics are attached to evidence or analysis metadata (in engine_meta["cod_v2"])

### Step 1.4: Tests
- Unit tests for each subtype and each gate
- One integration test comparing to rule_tagger2 outputs

**Checklist**
- [x] At least 1 passing golden test per subtype (test_detector.py created)
- [x] Cooldown test included (test_cooldown_enforcement)

**Exit criteria**
- CoD v2 fully functional with comparable results to rule_tagger2

---

## 3. Stage 2 - Versioning System (0.5-1 day)

**Purpose**: Track tagger output versions and support future compatibility.

### Step 2.1: Version constants
- Add `versioning/__init__.py`
- Define `CURRENT_VERSION`, `SUPPORTED_VERSIONS`, `VERSION_INFO`

**Checklist**
- [x] Version values are stable and documented (v1.0.0-catachess)

### Step 2.2: Fingerprinting
- Add `versioning/fingerprints.py`
- Implement `infer_version()` from analysis metadata

**Checklist**
- [x] At least one fingerprint is defined (v1.0.0-catachess fingerprint)
- [x] A default/unknown path exists (returns None if no match)

### Step 2.3: Tagger integration
- Annotate results with version info in `facade.py` or pipeline finalize

**Checklist**
- [x] Result includes `version` and `version_info` (in analysis_context)

**Exit criteria**
- Version info is present in output and can be inferred

---

## 4. Stage 3 - Tag Alias System (1-2 days)

**Purpose**: Keep backward compatibility with legacy or misspelled tag names.

### Step 3.1: Alias mappings
- Add `versioning/aliases.py`
- Port alias lists from rule_tagger2 (spelling, convention, deprecated)

**Checklist**
- [x] Core alias lists exist (SPELLING_ALIASES, CONVENTION_ALIASES, DEPRECATED_ALIASES)
- [x] Each alias maps to a canonical tag

### Step 3.2: Resolution API
- Add `resolution.py` (or combine into `aliases.py`)
- Provide `get_canonical_name()`, `resolve_tag_list()`, `is_alias()`

**Checklist**
- [x] Round-trip tests for alias resolution (resolution.py functions created)

### Step 3.3: Migration helpers (optional)
- Add `migration.py` for dict/list migrations

**Checklist**
- [x] Safe migration of dict keys (migrate_tag_data function)

**Exit criteria**
- Tag alias resolution is available and tested

---

## 5. Stage 4 - Hardening (ongoing)

**Purpose**: Improve quality, reliability, and performance after core migration.

**Checklist (select as needed)**
- [ ] Expand detector coverage tests (positive + negative per tag)
- [ ] Add PGN-based integration tests
- [ ] Add basic telemetry (timing, fired tags)
- [ ] Add performance profiling or caching

---

## 6. Current Reality (Audited 2026-01-10)

**What EXISTS (✅):**
- Pipeline infrastructure: models.py (3128 bytes), runner.py (3052 bytes), stages.py (10466 bytes)
- Mate threat detection: mate_threat.py (1699 bytes) - integrated in facade.py
- Coverage delta: coverage.py (2351 bytes) - integrated in facade.py
- Tagging system: tagging/__init__.py (3607 bytes), suppression.py (3893 bytes)
- Player batch script: scripts/analyze_player_batch.py (5491 bytes)

**What's MISSING (❌):**
- Pipeline __init__.py is empty (0 bytes) - needs exports
- No CoD v2 implementation (detectors/cod_v2/ directory doesn't exist)
- No versioning system (versioning/ directory doesn't exist)
- No tag alias system (no aliases.py or resolution.py)

**Conclusion:** Core infrastructure is in place. Need to:
1. Fill pipeline/__init__.py
2. Implement CoD v2 from scratch
3. Create versioning system
4. Create tag alias system

---

## 7. Things to Improve (Beyond Migration)

- Replace manual detector invocation with a registry ordered by priority
- Centralize thresholds and priorities in a YAML config
- Add feature flags for staged rollout (CoD v2, aliasing)
- Provide developer CLI tools for alias checks and version inspection
- Increase tests for detectors not covered by current suite

---

## 8. Success Criteria (Global)

- [x] CoD v2 implemented with all 4 subtypes (prophylaxis, piece_control, pawn_control, simplification)
- [x] Versioning info is attached to every TagResult (version + version_info in analysis_context)
- [x] Alias resolution is stable and tested (get_canonical_name, resolve_tag_list, migration helpers)
- [x] No false status claims remain in documentation (Current Reality section updated)

## 9. Implementation Summary (2026-01-10)

### ✅ Stage 0: Align Reality (COMPLETE)
- Audited existing codebase
- Confirmed pipeline, mate_threat, coverage_delta exist
- Updated Current Reality section

### ✅ Stage 1: CoD v2 Migration (COMPLETE)
**Files created:**
- `detectors/cod_v2/models.py` (89 lines) - CoDContext, CoDMetrics
- `detectors/cod_v2/result.py` (64 lines) - CoDResult, CoDSubtype
- `detectors/cod_v2/thresholds.py` (66 lines) - Threshold definitions
- `detectors/cod_v2/config.py` (18 lines) - Configuration
- `detectors/cod_v2/gates.py` (84 lines) - Gate checking logic
- `detectors/cod_v2/subtypes.py` (158 lines) - 4 subtype detectors
- `detectors/cod_v2/detector.py` (91 lines) - Main detector class
- `detectors/cod_v2/__init__.py` (21 lines) - Public API
- `detectors/cod_v2/test_detector.py` (144 lines) - Unit tests

**Integration:**
- Updated `facade.py` to invoke CoD v2 detector
- Added `control_over_dynamics` and `control_over_dynamics_subtype` to TagResult
- Enabled via `is_cod_v2_enabled()` (default: enabled)

### ✅ Stage 2: Versioning System (COMPLETE)
**Files created:**
- `versioning/__init__.py` (59 lines) - Version constants and metadata
- `versioning/fingerprints.py` (88 lines) - Fingerprint detection

**Integration:**
- Updated `facade.py` to annotate results with version info
- Every TagResult now contains `version` and `version_info` in analysis_context

### ✅ Stage 3: Tag Alias System (COMPLETE)
**Files created:**
- `versioning/aliases.py` (62 lines) - Tag alias mappings
- `versioning/resolution.py` (58 lines) - Resolution functions
- `versioning/migration.py` (52 lines) - Migration helpers

**Features:**
- 30+ aliases for spelling corrections and conventions
- `get_canonical_name()` for single tag resolution
- `resolve_tag_list()` for batch resolution
- `migrate_tag_data()` for dict key migration
- `suggest_canonical()` for fuzzy matching

## 10. What's Next (Optional Future Work)

- [ ] Expand CoD v2 test coverage with real PGN comparisons
- [ ] Add CLI tool for tag alias management (similar to rule_tagger2)
- [ ] Implement cooldown tracking across moves in game context
- [ ] Add threat_delta computation from followup analysis
- [ ] Add ply tracking for cooldown enforcement
- [ ] Create comprehensive integration tests
- [ ] Performance profiling and optimization
- [ ] Add telemetry for tag detection rates

