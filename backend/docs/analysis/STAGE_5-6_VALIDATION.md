# Stage 5-6: Integration Testing & Production Validation

**Date**: 2026-01-11
**Status**: FRAMEWORK READY - Requires Runtime Environment
**Prerequisites**: Stages 0-4 COMPLETE ✅

---

## Overview

Stages 5-6 focus on **end-to-end validation** of the prophylaxis detection system. Since we don't have access to the full runtime environment (chess engine, actual game data), this document provides:

1. **Test framework templates** (ready to run when environment is available)
2. **Validation checklists** (what to verify)
3. **Production readiness criteria** (gate conditions)

---

## Stage 5: End-to-End Integration Testing

### 5.1 Test Positions Created ✅

**File**: `tests/fixtures/prophylaxis_positions.json` (16 test positions)

**Coverage**:
- ✅ 2 prophylactic_direct positions (high-quality prophylaxis)
- ✅ 2 prophylactic_latent positions (subtle prophylaxis)
- ✅ 2 prophylactic_meaningless positions (failed attempts)
- ✅ 2 non-prophylactic positions (control cases)
- ✅ 3 filtered candidate positions (capture, check, early opening)
- ✅ 3 pattern detection positions (bishop retreat, knight reposition, king shuffle)
- ✅ 2 edge case positions (full material, missing piece)

**Position Categories**:

| Category | Count | Description |
|----------|-------|-------------|
| prophylactic_direct | 2 | High-quality direct prophylaxis (conf ≥0.75) |
| prophylactic_latent | 2 | Subtle latent prophylaxis (conf 0.45-0.75) |
| prophylactic_meaningless | 2 | Failed prophylaxis with eval drop |
| non_prophylactic | 2 | Normal moves (should NOT fire) |
| filtered_candidate | 3 | Should be filtered by gates |
| pattern_detection | 3 | Specific pattern types |
| edge_case | 2 | Boundary conditions |

**Expected Results**:
Each position specifies:
- Expected tags (should fire)
- Expected confidence range
- Expected gates failed (for filtered positions)
- Expected pattern names (for pattern positions)

### 5.2 Integration Test Framework Created ✅

**File**: `tests/integration/test_prophylaxis_integration.py`

**Test Classes**:

1. **TestProphylaxisIntegration** - Main test suite
   - test_prophylactic_direct_positions()
   - test_prophylactic_latent_positions()
   - test_prophylactic_meaningless_positions()
   - test_non_prophylactic_positions()
   - test_filtered_candidate_positions()
   - test_pattern_detection()
   - test_edge_cases()
   - test_confidence_ranges()
   - test_each_position_individually() (parametrized)

2. **test_load_positions_fixture()** - Fixture validation

**Status**: ⚠️ TEMPLATE READY - Requires runtime environment

**To Run** (once environment is ready):
```bash
# Install dependencies
pip install pytest python-chess

# Ensure engine is available
which stockfish

# Run tests
pytest tests/integration/test_prophylaxis_integration.py -v -s

# Run specific test
pytest tests/integration/test_prophylaxis_integration.py::TestProphylaxisIntegration::test_prophylactic_direct_positions -v

# Run with detailed output
pytest tests/integration/test_prophylaxis_integration.py -v -s --tb=short
```

### 5.3 What Needs Implementation

**CRITICAL**: The test framework is a template. To make it functional:

1. **TagContext Population** (`create_tag_context()` method)
   ```python
   def create_tag_context(self, position: Dict[str, Any]) -> TagContext:
       # TODO: Implement full context creation
       # 1. Parse FEN to board
       # 2. Apply move
       # 3. Run engine analysis (before & after)
       # 4. Compute all metrics:
       #    - eval_before, eval_after, delta_eval
       #    - component_deltas (mobility, structure, king_safety, tactics)
       #    - opp_component_deltas
       #    - threat_delta (via estimate_opponent_threat)
       #    - tactical_weight, effective_delta
       #    - volatility_drop
       # 5. Populate TagContext with all fields
   ```

2. **Engine Integration**
   - Stockfish or other UCI engine must be accessible
   - Engine path configuration
   - Analysis depth configuration (match rule_tagger2: depth 6 for threats, depth 18+ for eval)

3. **Metric Computation**
   - Mobility computation (piece mobility scores)
   - Structure evaluation (pawn structure, weaknesses)
   - King safety assessment
   - Tactics detection (hanging pieces, pins, forks)
   - All must match rule_tagger2's computation methods

### 5.4 Success Criteria

**Gate Conditions** (must pass before Stage 6):

- [ ] All 16 test positions load successfully
- [ ] No crashes or exceptions for any position
- [ ] Direct positions fire with confidence ≥0.75
- [ ] Latent positions fire with confidence 0.45-0.75
- [ ] Meaningless positions fire with confidence ≥0.60
- [ ] Non-prophylactic positions do NOT fire
- [ ] Filtered positions fail the "candidate" gate
- [ ] Pattern positions return correct pattern names
- [ ] Edge cases handle gracefully (no crashes)
- [ ] ≥90% match rate on expected tags

**Quality Metrics**:

| Metric | Target | Acceptance Threshold |
|--------|--------|----------------------|
| Correct tag rate | 100% | ≥95% |
| Confidence accuracy | ±0.05 | ±0.10 |
| False positive rate | 0% | ≤5% |
| False negative rate | 0% | ≤5% |
| Crash rate | 0% | 0% (strict) |

---

## Stage 6: Regression Testing & Production Validation

### 6.1 Golden Dataset Testing

**Objective**: Test against a large dataset with known labels

**Approach**:

1. **Collect Golden Dataset**
   - Source: Previous rule_tagger2 runs on real games
   - Format: JSON with {fen, move, expected_tags, expected_confidence}
   - Size: ≥1000 positions covering all tag types
   - Distribution:
     - 200 prophylactic_direct
     - 300 prophylactic_latent
     - 100 prophylactic_meaningless
     - 400 non-prophylactic (control)

2. **Run Comparison**
   ```python
   def test_golden_dataset():
       golden = load_golden_dataset()

       matches = 0
       mismatches = []

       for position in golden:
           ctx = create_tag_context(position)
           results = run_all_detectors(ctx)

           expected_tags = set(position["expected_tags"])
           actual_tags = set(results.fired_tags)

           if expected_tags == actual_tags:
               matches += 1
           else:
               mismatches.append({
                   "position": position,
                   "expected": expected_tags,
                   "actual": actual_tags,
                   "diff": expected_tags.symmetric_difference(actual_tags)
               })

       match_rate = matches / len(golden)
       assert match_rate >= 0.95, f"Match rate {match_rate:.1%} below 95%"
   ```

3. **Analyze Mismatches**
   - Categorize by type (false positive / false negative)
   - Identify patterns in mismatches
   - Verify if mismatches are due to:
     - Bugs in implementation
     - Improvements over rule_tagger2
     - Ambiguous positions

**Success Criteria**:
- [ ] ≥95% match rate on golden dataset
- [ ] All critical positions (annotated by experts) match 100%
- [ ] No systematic errors (e.g., all latent mis-classified as meaningless)

### 6.2 Performance Benchmarking

**Metrics to Measure**:

1. **Latency**
   ```python
   import time

   def benchmark_detector_latency():
       positions = load_test_positions()

       times = {
           "prophylactic_move": [],
           "prophylactic_direct": [],
           "prophylactic_latent": [],
           "prophylactic_meaningless": [],
       }

       for position in positions * 100:  # 100x for stable measurements
           ctx = create_tag_context(position)

           for detector_name, detector_func in detectors.items():
               start = time.perf_counter()
               detector_func(ctx)
               elapsed = time.perf_counter() - start
               times[detector_name].append(elapsed)

       for name, measurements in times.items():
           avg = sum(measurements) / len(measurements)
           p50 = sorted(measurements)[len(measurements) // 2]
           p95 = sorted(measurements)[int(len(measurements) * 0.95)]
           p99 = sorted(measurements)[int(len(measurements) * 0.99)]

           print(f"{name}:")
           print(f"  Avg: {avg*1000:.2f}ms")
           print(f"  P50: {p50*1000:.2f}ms")
           print(f"  P95: {p95*1000:.2f}ms")
           print(f"  P99: {p99*1000:.2f}ms")
   ```

   **Targets**:
   - Average latency: <10ms per detector (excluding engine time)
   - P95 latency: <20ms
   - P99 latency: <50ms

2. **Memory Usage**
   ```python
   import tracemalloc

   def benchmark_memory():
       tracemalloc.start()

       # Run detectors on all positions
       for position in load_test_positions() * 100:
           ctx = create_tag_context(position)
           detect_prophylactic_direct(ctx)

       current, peak = tracemalloc.get_traced_memory()
       tracemalloc.stop()

       print(f"Current memory: {current / 1024 / 1024:.2f} MB")
       print(f"Peak memory: {peak / 1024 / 1024:.2f} MB")
   ```

   **Targets**:
   - Peak memory: <50MB for 1000 positions
   - No memory leaks (constant memory after warm-up)

3. **Throughput**
   - Target: ≥100 positions/second (excluding engine time)
   - Measured with: `python -m pytest --durations=0`

**Success Criteria**:
- [ ] Latency within targets (avg <10ms, p95 <20ms)
- [ ] Memory within targets (peak <50MB for 1000 positions)
- [ ] Throughput ≥100 positions/second
- [ ] No memory leaks detected

### 6.3 Code Quality Checks

**Static Analysis**:
```bash
# Type checking
mypy backend/core/tagger/detectors/prophylaxis/ --strict

# Linting
pylint backend/core/tagger/detectors/prophylaxis/ --max-line-length=120

# Code formatting
black backend/core/tagger/detectors/prophylaxis/ --check

# Security scan
bandit -r backend/core/tagger/detectors/prophylaxis/
```

**Test Coverage**:
```bash
# Run coverage
pytest tests/ --cov=backend.core.tagger.detectors.prophylaxis --cov-report=html

# Check thresholds
coverage report --fail-under=95
```

**Success Criteria**:
- [ ] Type checking passes with no errors
- [ ] Linting passes with score ≥9.0/10
- [ ] Code formatted consistently
- [ ] No security issues found
- [ ] Test coverage ≥95%

### 6.4 Production Readiness Checklist

**Functional Requirements**:
- [x] All core functions implemented (Stage 1)
- [x] All detectors implemented (Stage 4)
- [x] 100% rule_tagger2 match (verified in Stage 0-4)
- [ ] Integration tests pass (Stage 5 - requires environment)
- [ ] Golden dataset tests pass (Stage 6.1)
- [ ] Edge cases handled gracefully

**Performance Requirements**:
- [ ] Latency targets met
- [ ] Memory targets met
- [ ] Throughput targets met
- [ ] No memory leaks
- [ ] No performance regressions vs rule_tagger2

**Quality Requirements**:
- [x] Code review completed (Stages 0-4 audited at 98/100)
- [x] Documentation complete (spec, audit report, summaries)
- [x] Type hints added for all functions
- [x] Docstrings complete
- [ ] Test coverage ≥95%
- [ ] Static analysis passes

**Operational Requirements**:
- [ ] Logging configured
- [ ] Error handling complete
- [ ] Monitoring metrics defined
- [ ] Deployment guide written
- [ ] Rollback plan documented

**Security Requirements**:
- [ ] No hardcoded secrets
- [ ] Input validation for all external inputs
- [ ] Engine path validation (prevent command injection)
- [ ] Resource limits enforced (prevent DoS)

---

## Implementation Priorities

### Must Have (Blocking for Production)

1. ✅ Core functions (Stage 1) - COMPLETE
2. ✅ Detectors (Stage 4) - COMPLETE
3. ⚠️ TagContext population - **NEEDS IMPLEMENTATION**
4. ⚠️ Engine integration - **NEEDS IMPLEMENTATION**
5. ⚠️ Integration tests passing - **NEEDS ENVIRONMENT**

### Should Have (Important for Quality)

6. Golden dataset testing
7. Performance benchmarking
8. Memory profiling
9. Comprehensive error handling
10. Monitoring and logging

### Nice to Have (Future Enhancements)

11. Additional pattern types
12. Confidence calibration
13. Explainability features
14. A/B testing framework
15. Performance optimizations

---

## Risk Assessment

### High Risk Items

1. **Engine Integration Complexity** ⚠️
   - Risk: Engine analysis may be slow or unreliable
   - Mitigation: Use caching, timeouts, fallback strategies

2. **Metric Computation Accuracy** ⚠️
   - Risk: Component deltas may not match rule_tagger2 exactly
   - Mitigation: Thorough testing against golden dataset

3. **TagContext Field Mismatches** ⚠️
   - Risk: Missing or incorrect fields in TagContext
   - Mitigation: Validate all fields, use getattr() with defaults

### Medium Risk Items

4. **Performance Bottlenecks**
   - Risk: Detectors may be slower than expected
   - Mitigation: Profile and optimize hot paths

5. **Memory Leaks**
   - Risk: Long-running processes may leak memory
   - Mitigation: Memory profiling, proper resource cleanup

### Low Risk Items

6. **Edge Cases**
   - Risk: Rare positions may cause unexpected behavior
   - Mitigation: Comprehensive test coverage

7. **Backward Compatibility**
   - Risk: API changes may break existing code
   - Mitigation: Maintain dual interface (detailed + simple)

---

## Next Steps

### Immediate (Stage 5)

1. **Set up runtime environment**
   - Install chess engine (Stockfish)
   - Configure engine paths
   - Test engine accessibility

2. **Implement TagContext population**
   - Integrate with existing catachess evaluation pipeline
   - Compute all required metrics
   - Validate against rule_tagger2 outputs

3. **Run integration tests**
   - Execute test suite on all 16 positions
   - Fix any failures
   - Verify success criteria

### Short-term (Stage 6)

4. **Collect golden dataset**
   - Export positions from rule_tagger2 runs
   - Format as JSON fixtures
   - Ensure diverse coverage

5. **Run golden dataset tests**
   - Compare outputs
   - Analyze mismatches
   - Iterate on fixes

6. **Performance benchmarking**
   - Measure latency, memory, throughput
   - Identify bottlenecks
   - Optimize if needed

### Medium-term (Production)

7. **Production deployment**
   - Deploy to staging environment
   - Run smoke tests
   - Monitor for issues

8. **Gradual rollout**
   - A/B testing (10% -> 50% -> 100%)
   - Monitor accuracy metrics
   - Rollback if issues detected

9. **Continuous monitoring**
   - Set up dashboards
   - Alert on anomalies
   - Regular quality audits

---

## Success Definition

**Stage 5 SUCCESS** = All integration tests pass on 16 test positions

**Stage 6 SUCCESS** =
- Golden dataset tests pass (≥95% match rate)
- Performance targets met
- Code quality checks pass
- Production readiness checklist complete

**OVERALL SUCCESS** =
- 100% functional equivalence with rule_tagger2
- No performance regressions
- Production deployed and stable
- User satisfaction high

---

## Conclusion

Stages 5-6 are **framework complete** but **require runtime environment** to execute.

**What We Have**:
- ✅ 16 test positions covering all scenarios
- ✅ Complete integration test framework
- ✅ Validation checklists and success criteria
- ✅ Performance benchmarking templates
- ✅ Production readiness checklist

**What We Need**:
- ⚠️ Chess engine setup and integration
- ⚠️ TagContext full population logic
- ⚠️ Golden dataset from rule_tagger2
- ⚠️ Actual runtime environment for testing

**Estimated Effort** (once environment is ready):
- Stage 5: 2-3 days (TagContext implementation + testing)
- Stage 6: 3-5 days (golden dataset + performance + fixes)
- **Total**: 5-8 days

**Status**: **READY TO EXECUTE** once runtime environment is available. All preparation work complete.

---

**Generated**: 2026-01-11
**Status**: Framework Complete, Awaiting Environment
**Next**: Set up engine integration and run Stage 5 tests
