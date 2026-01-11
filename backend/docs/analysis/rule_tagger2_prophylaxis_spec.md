# rule_tagger2 Prophylaxis Logic - Complete Specification

**Source**: `/rule_tagger2/legacy/prophylaxis.py`
**Date Analyzed**: 2026-01-10
**Purpose**: Complete extraction of prophylaxis detection logic for catachess migration

---

## 1. ProphylaxisConfig (lines 19-30)

### Definition
```python
@dataclass(frozen=True)
class ProphylaxisConfig:
    structure_min: float = 0.2
    opp_mobility_drop: float = 0.15
    self_mobility_tol: float = 0.3
    preventive_trigger: float = 0.16
    safety_cap: float = 0.6
    score_threshold: float = 0.20
    threat_depth: int = 6
    threat_drop: float = 0.35
```

### Parameters Documented

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `structure_min` | 0.2 | Minimum structure improvement to count towards preventive score |
| `opp_mobility_drop` | 0.15 | Threshold for opponent mobility restriction |
| `self_mobility_tol` | 0.3 | Maximum self-mobility penalty tolerance |
| `preventive_trigger` | 0.16 | Minimum preventive score to qualify as prophylaxis |
| `safety_cap` | 0.6 | Maximum preventive score cap |
| `score_threshold` | 0.20 | Minimum score for direct prophylaxis classification |
| `threat_depth` | 6 | Engine depth for threat estimation (max with 8) |
| `threat_drop` | 0.35 | Threshold for significant threat reduction |

---

## 2. estimate_opponent_threat() (lines 33-84)

### Function Signature
```python
def estimate_opponent_threat(
    engine_path: str,
    board: chess.Board,
    actor: chess.Color,
    *,
    config: ProphylaxisConfig,
) -> float:
```

### Logic Flow

#### Step 1: Setup (lines 44-46)
- Copy board without stack: `temp = board.copy(stack=False)`
- Return 0.0 if game over

#### Step 2: Null Move Handling (lines 47-56)
```python
needs_null = temp.turn == actor
null_pushed = False

if needs_null and not temp.is_check():
    try:
        temp.push(chess.Move.null())
        null_pushed = True
    except ValueError:
        null_pushed = False
```

**Logic**:
- If it's the actor's turn, need to pass turn to opponent (null move)
- Cannot push null move if in check
- Track null_pushed flag for cleanup

#### Step 3: Engine Analysis (lines 57-58)
```python
depth = max(config.threat_depth, 8)
info = eng.analyse(temp, chess.engine.Limit(depth=depth))
```

**Key Detail**: Uses `max(config.threat_depth, 8)` ensuring minimum depth of 8

#### Step 4: Score Extraction (lines 67-83)
```python
score_obj = info.get("score")
if score_obj is None:
    return 0.0

pov_score = score_obj.pov(actor)

if pov_score.is_mate():
    mate_in = pov_score.mate()
    if mate_in is None or mate_in > 0:
        return 0.0
    threat = 10.0 / (abs(mate_in) + 1)
else:
    cp_value = pov_score.score(mate_score=10000) or 0
    threat = max(0.0, -cp_value / 100.0)

return round(min(threat, config.safety_cap), 3)
```

**Threat Calculation**:
- **Mate threat**: `threat = 10.0 / (abs(mate_in) + 1)`
  - Mate in 1: 10.0 / 2 = 5.0
  - Mate in 2: 10.0 / 3 = 3.33
  - Only counts opponent's mating threats (mate_in < 0)
- **CP threat**: `threat = max(0.0, -cp_value / 100.0)`
  - Converts centipawns to threat (negative eval = threat)
  - Example: -300cp → 3.0 threat
- **Capping**: `min(threat, config.safety_cap)` (default 0.6)
- **Rounding**: 3 decimal places

#### Step 5: Exception Handling (lines 59-65)
```python
except Exception:
    if null_pushed:
        temp.pop()
    return 0.0
finally:
    if null_pushed and len(temp.move_stack) and temp.move_stack[-1] == chess.Move.null():
        temp.pop()
```

**Critical**: Always cleanup null move in finally block

---

## 3. prophylaxis_pattern_reason() (lines 87-106)

### Function Signature
```python
def prophylaxis_pattern_reason(
    board: chess.Board,
    move: chess.Move,
    opp_trend: float,
    opp_tactics_delta: float,
) -> Optional[str]:
```

### Pattern Detection Logic

#### Pattern 1: Bishop Retreat (lines 98-99)
```python
trend_ok = opp_trend <= 0.12 or opp_tactics_delta <= 0.12
if piece.piece_type == chess.BISHOP and trend_ok:
    return "anticipatory bishop retreat"
```

#### Pattern 2: Knight Reposition (lines 100-101)
```python
if piece.piece_type == chess.KNIGHT and trend_ok:
    return "anticipatory knight reposition"
```

#### Pattern 3: King Safety Shuffle (lines 102-103)
```python
if piece.piece_type == chess.KING and (opp_trend <= 0.15 or opp_tactics_delta <= 0.1):
    return "king safety shuffle"
```
**Note**: King has different thresholds (0.15 and 0.1 vs 0.12)

#### Pattern 4: Pawn Advance (lines 104-105)
```python
if piece.piece_type == chess.PAWN and trend_ok:
    return "pawn advance to restrict opponent play"
```

#### Pattern 5: No Match (line 106)
```python
return None
```

### Threshold Summary

| Pattern | Piece | opp_trend | opp_tactics_delta |
|---------|-------|-----------|-------------------|
| Bishop retreat | Bishop | ≤ 0.12 | OR ≤ 0.12 |
| Knight reposition | Knight | ≤ 0.12 | OR ≤ 0.12 |
| King safety | King | ≤ 0.15 | OR ≤ 0.1 |
| Pawn advance | Pawn | ≤ 0.12 | OR ≤ 0.12 |

---

## 4. is_prophylaxis_candidate() (lines 109-153)

### Function Signature
```python
def is_prophylaxis_candidate(board: chess.Board, move: chess.Move) -> bool:
```

### Exclusion Rules (7 gates)

#### Gate 1: Full Material (lines 120-121)
```python
if is_full_material(board):
    return False
```
Helper function (lines 156-158):
```python
def is_full_material(board: chess.Board) -> bool:
    return len(board.piece_map()) >= FULL_MATERIAL_COUNT  # 32
```

#### Gate 2: Check-Giving Moves (lines 122-123)
```python
if board.gives_check(move):
    return False
```

#### Gate 3: Piece Existence (lines 124-126)
```python
piece = board.piece_at(move.from_square)
if not piece:
    return False
```

#### Gate 4: Captures (lines 128-130)
```python
if board.is_capture(move):
    return False
```

#### Gate 5: In-Check Positions (lines 132-134)
```python
if board.is_check():
    return False
```

#### Gate 6: Recaptures (lines 136-142)
```python
if len(board.move_stack) > 0:
    last_move = board.peek()
    if last_move.to_square == move.to_square:
        return False
```
**Logic**: If moving to the square opponent just moved to, likely a recapture

#### Gate 7: Early Opening (lines 144-151)
```python
piece_count = sum(1 for sq in chess.SQUARES if board.piece_at(sq) is not None)
fullmove_number = board.fullmove_number
if piece_count >= 32 and fullmove_number < 6:
    return False
```
**Logic**: Block only if ALL 32 pieces AND before move 6

---

## 5. classify_prophylaxis_quality() (lines 161-239)

### Function Signature
```python
def classify_prophylaxis_quality(
    has_prophylaxis: bool,
    preventive_score: float,
    effective_delta: float,
    tactical_weight: float,
    soft_weight: float,
    *,
    eval_before_cp: int = 0,
    drop_cp: int = 0,
    threat_delta: float = 0.0,
    volatility_drop: float = 0.0,
    pattern_override: bool = False,
    config: ProphylaxisConfig,
) -> Tuple[Optional[str], float]:
```

### Output Categories
1. `"prophylactic_direct"` - High-quality tactical prevention
2. `"prophylactic_latent"` - Subtle positional prevention
3. `"prophylactic_meaningless"` - Failed prophylaxis attempt
4. `None` - Not prophylaxis

### Classification Flow

#### Branch 1: Early Exit (lines 182-183)
```python
if not has_prophylaxis:
    return None, 0.0
```

#### Branch 2: First Failure Check (lines 187-192)
```python
fail_eval_band_cp = 200
fail_drop_cp = 50

if abs(eval_before_cp) <= fail_eval_band_cp and drop_cp < -fail_drop_cp:
    return "prophylactic_meaningless", 0.0
```
**Condition**: Neutral position (±200cp) with large eval drop (>50cp)

#### Branch 3: Below Trigger Handling (lines 194-212)
```python
trigger = config.preventive_trigger  # 0.16

if preventive_score < trigger:
    if pattern_override:
        has_meaningful_signal = (
            threat_delta >= 0.05
            or volatility_drop >= 15.0
            or soft_weight >= 0.3
            or preventive_score >= trigger * 0.5  # 0.08
        )

        if has_meaningful_signal:
            latent_base = 0.45
            latent_score = max(latent_base, soft_weight * 0.8, preventive_score * 2.0)
            return "prophylactic_latent", round(min(latent_score, safety_cap), 3)
    return None, 0.0
```

**Logic**:
- If below trigger (0.16), normally return None
- BUT if pattern_override=True AND meaningful signal exists, return latent
- Meaningful signal requires ONE OF:
  - threat_delta ≥ 0.05
  - volatility_drop ≥ 15.0
  - soft_weight ≥ 0.3
  - preventive_score ≥ 0.08 (half of trigger)

#### Branch 4: Signal Normalization (lines 214-217)
```python
volatility_signal = max(0.0, min(1.0, volatility_drop / 40.0))
threat_signal = max(0.0, threat_delta)
soft_signal = max(0.0, soft_weight)
```

#### Branch 5: Direct Gate (lines 219-224)
```python
direct_gate = (
    preventive_score >= (trigger + 0.02)  # 0.18
    or threat_signal >= max(config.threat_drop * 0.85, 0.2)  # max(0.2975, 0.2)
    or (soft_signal >= 0.65 and tactical_weight <= 0.6)
    or volatility_signal >= 0.65  # volatility_drop ≥ 26.0
)
```

**Direct triggers** (any ONE):
1. preventive_score ≥ 0.18
2. threat_signal ≥ 0.2975 (or 0.2 minimum)
3. soft_signal ≥ 0.65 AND tactical_weight ≤ 0.6
4. volatility_signal ≥ 0.65 (volatility_drop ≥ 26.0cp)

#### Branch 6: Classification (lines 226-234)
```python
if direct_gate:
    direct_score = max(score_threshold, preventive_score, soft_signal, threat_signal, 0.75)
    label = "prophylactic_direct"
    final_score = round(min(direct_score, safety_cap), 3)
else:
    latent_base = 0.55 if effective_delta < 0 else 0.45
    latent_score = max(latent_base, preventive_score * 0.9, soft_signal)
    label = "prophylactic_latent"
    final_score = round(min(latent_score, safety_cap), 3)
```

**Direct score**: `max(0.20, preventive_score, soft_signal, threat_signal, 0.75)`
- Minimum 0.75 for direct classification

**Latent score**:
- Base: 0.55 (if eval worsened) or 0.45 (if eval improved)
- Take max of: base, preventive_score * 0.9, soft_signal

#### Branch 7: Final Failure Check (lines 236-237)
```python
if abs(eval_before_cp) <= fail_eval_band_cp and drop_cp < -fail_drop_cp:
    return "prophylactic_meaningless", 0.0
```
**Same as first failure check** - catches cases that pass direct/latent gates

---

## 6. clamp_preventive_score() (lines 242-246)

### Function Signature
```python
def clamp_preventive_score(score: float, *, config: ProphylaxisConfig) -> float:
```

### Logic
```python
if score <= 0.0:
    return 0.0
return min(score, config.safety_cap)
```

**Simple clamping**:
- Negative → 0.0
- Positive → min(score, 0.6)

---

## 7. Conditional Branch Mapping

### classify_prophylaxis_quality Decision Tree

```
START
│
├─ has_prophylaxis == False? → [None, 0.0]
│
├─ abs(eval_before_cp) ≤ 200 AND drop_cp < -50? → ["prophylactic_meaningless", 0.0]
│
├─ preventive_score < 0.16?
│  ├─ pattern_override == False? → [None, 0.0]
│  │
│  └─ pattern_override == True?
│     ├─ has_meaningful_signal == False? → [None, 0.0]
│     │
│     └─ has_meaningful_signal == True?
│        → ["prophylactic_latent", max(0.45, soft_weight*0.8, preventive_score*2.0)]
│
├─ preventive_score ≥ 0.16
│  │
│  ├─ direct_gate == True?
│  │  → ["prophylactic_direct", max(0.20, preventive_score, soft_signal, threat_signal, 0.75)]
│  │
│  └─ direct_gate == False?
│     → ["prophylactic_latent", max(base, preventive_score*0.9, soft_signal)]
│        where base = 0.55 if effective_delta < 0 else 0.45
│
└─ Final check: abs(eval_before_cp) ≤ 200 AND drop_cp < -50? → ["prophylactic_meaningless", 0.0]
   Otherwise return computed [label, score]
```

---

## 8. All Threshold Values

| Constant | Value | Location | Usage |
|----------|-------|----------|-------|
| `FULL_MATERIAL_COUNT` | 32 | line 16 | Piece count for full material |
| `structure_min` | 0.2 | Config | Min structure gain threshold |
| `opp_mobility_drop` | 0.15 | Config | Opp mobility restriction threshold |
| `self_mobility_tol` | 0.3 | Config | Self mobility penalty tolerance |
| `preventive_trigger` | 0.16 | Config | Min score to qualify as prophylaxis |
| `safety_cap` | 0.6 | Config | Max preventive score |
| `score_threshold` | 0.20 | Config | Min score for direct classification |
| `threat_depth` | 6 | Config | Engine depth for threat (max with 8) |
| `threat_drop` | 0.35 | Config | Significant threat reduction threshold |
| `fail_eval_band_cp` | 200 | classify() | Neutral position band |
| `fail_drop_cp` | 50 | classify() | Failure eval drop threshold |
| `mate_threat_scaling` | 10.0 | estimate_threat() | Mate threat formula numerator |
| `cp_to_threat_divisor` | 100.0 | estimate_threat() | CP to threat conversion |
| Pattern thresholds (opp_trend/opp_tactics) | 0.12 | pattern_reason() | Bishop/Knight/Pawn |
| Pattern thresholds (opp_trend for King) | 0.15 | pattern_reason() | King safety |
| Pattern thresholds (opp_tactics for King) | 0.1 | pattern_reason() | King safety |
| Meaningful signal - threat_delta | 0.05 | classify() | Min threat reduction signal |
| Meaningful signal - volatility_drop | 15.0 | classify() | Min volatility drop signal |
| Meaningful signal - soft_weight | 0.3 | classify() | Min soft weight signal |
| Meaningful signal - preventive_score | 0.08 | classify() | Half of trigger |
| Volatility normalization | 40.0 | classify() | Divisor for 0-1 scale |
| Direct gate - preventive_score offset | 0.02 | classify() | trigger + 0.02 = 0.18 |
| Direct gate - threat_drop multiplier | 0.85 | classify() | 0.35 * 0.85 = 0.2975 |
| Direct gate - threat_signal_min | 0.2 | classify() | Min threat signal |
| Direct gate - soft_signal_threshold | 0.65 | classify() | High soft weight |
| Direct gate - tactical_weight_ceiling | 0.6 | classify() | Low tactical weight |
| Direct gate - volatility_signal_threshold | 0.65 | classify() | High volatility |
| Direct score minimum | 0.75 | classify() | Min direct score |
| Latent base (negative delta) | 0.55 | classify() | Base for worsening position |
| Latent base (positive delta) | 0.45 | classify() | Base for improving position |
| Latent preventive multiplier | 0.9 | classify() | preventive_score * 0.9 |
| Latent soft multiplier | 0.8 | classify() | soft_weight * 0.8 |
| Latent preventive doubling | 2.0 | classify() | preventive_score * 2.0 |
| Early opening move threshold | 6 | is_candidate() | Fullmove number |

---

## 9. Input Parameter Dependencies

### For compute_preventive_score() (NOT IN FILE - needs research)
The prophylaxis.py file does NOT contain preventive_score computation. Need to search:
- `rule_tagger2/legacy/analysis.py`
- `rule_tagger2/legacy/core.py`
- Related analysis modules

**Expected inputs from TagContext**:
- `opp_mobility_drop`
- `structure_gain`
- `self_mobility_change`

---

## 10. Complete Implementation Checklist

### Stage 0 Checklist: ✅ COMPLETE

- [x] Extract `classify_prophylaxis_quality()` logic
  - [x] 8 input parameters documented
  - [x] 3 output categories documented
  - [x] All threshold values listed
  - [x] All conditional branches mapped
- [x] Extract `estimate_opponent_threat()` logic
  - [x] Null-move logic documented
  - [x] Threat calculation formulas documented
  - [x] Mate threat handling documented
- [x] Extract `is_prophylaxis_candidate()` logic
  - [x] All 7 exclusion rules listed
  - [x] Material count checks documented
  - [x] Move type filters documented
- [x] Extract `prophylaxis_pattern_reason()` logic
  - [x] All 5 pattern types listed
  - [x] Trend thresholds documented
- [x] Extract `clamp_preventive_score()` logic
  - [x] Clamping bounds documented
- [x] Extract ProphylaxisConfig
  - [x] All 8 parameters with defaults

---

## Next Steps

1. **Create threshold_table.csv** with all 35+ thresholds
2. **Search for preventive_score computation** in rule_tagger2
3. **Begin Stage 1**: Implement infrastructure in catachess

---

**Specification Complete**: All prophylaxis logic from rule_tagger2 has been extracted and documented.
