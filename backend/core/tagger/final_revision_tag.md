# Final Revision - ChessorTag Implementation Review

Source references:
- `catachess/chessortag.md`
- `catachess/fixchessortag.md`

## 1. Potential issues

- `catachess/backend/core/tagger/facade.py` calls undefined functions:
  - `indetect_accurate_knight_bishop_exchange` (should be `detect_inaccurate_knight_bishop_exchange`)
  - `neutral_detect_tension_creation` (should be `detect_neutral_tension_creation`)
  - `inaccurate_detect_tactical_sacrifice` (should be `detect_inaccurate_tactical_sacrifice`)
  These will raise `NameError` at runtime and block tagging.
- `catachess/backend/core/tagger/facade.py` leaves `mate_threat` and `coverage_delta` as TODOs.
  This makes tactical weighting and any coverage-related tags inaccurate or always defaulted.
- `catachess/backend/core/tagger/pipeline/__init__.py` and `catachess/backend/core/tagger/tagging/__init__.py` are empty.
  The pipeline and orchestration in `catachess/chessortag.md` are not actually wired.
- `catachess/backend/core/tagger/detectors/helpers/control.py` is explicitly a simplified placeholder,
  yet `catachess/backend/core/tagger/tag_result.py` and `catachess/backend/core/tagger/config/priorities.py`
  already include CoD/control tags. This creates a mismatch between model surface area and execution.
- Tests in `catachess/tests/tagger/` focus on helpers, models, engine, and meta tags, but there are
  no direct tests for most detectors (opening, exchange, structure, initiative, tension, maneuver,
  prophylaxis, sacrifice). Regression risk remains high.

## 2. Things to improve

- Fix the facade function name mismatches and add a quick unit test that executes `tag_position`
  on a minimal FEN to catch NameError-level wiring issues.
- Implement the missing P0 items from `catachess/chessortag.md`:
  mate threat detection, coverage delta, and CoD series gating.
- Replace hard-coded detector execution in `catachess/backend/core/tagger/facade.py` with a registry
  (ordered by priority), so adding new detectors does not require manual wiring changes.
- Add a YAML-backed configuration layer (thresholds, priorities, engine settings) as described in
  the plan to reduce hard-coded constants scattered in detectors.
- Expand tests to cover each detector family (at least one positive and one negative case per tag)
  and add PGN-based integration tests for realistic end-to-end validation.
- Add minimal telemetry hooks (timings, fired tags, evidence counts) to support debugging and
  performance profiling when scaling or running batch analysis.

## 3. What has not been done

- CoD series: no dedicated detectors for `control_*` or `control_over_dynamics` tags, only placeholder
  helpers and TagResult fields.
- Pipeline system and gating system as specified in `catachess/chessortag.md`.
- Mate threat detection and coverage delta computation (`catachess/backend/core/tagger/facade.py`).
- Versioning and tag alias system, plus any migration tooling.
- YAML configuration system for tagger settings and thresholds.
- Telemetry/diagnostics collection.
- Performance roadmap items: caching, concurrency, batch/streaming analysis, and benchmarks.
- Multi-engine support, async support, distributed processing, and web API layer.
