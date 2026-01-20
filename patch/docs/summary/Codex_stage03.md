# Stage 03 - chess.js 回放与 FEN 生成 完成报告

## 目标
实现 chess.js 的回放工具与 FEN 生成工具，但严格不持久化。

## 完成状态

### Checklist

- [x] 在 `patch/chessJS/replay.ts` 实现 `replaySanPath(moves: string[], startFen?: string)`。
- [x] `replaySanPath` 返回 `{ board, historySan, illegalMoveIndex }` 类似结构。
- [x] 在 `patch/chessJS/fen.ts` 实现 `fenFromPath(moves: string[], startFen?: string)`。
- [x] 为非法 SAN 返回明确错误（不要吞错），并在 StudyContext 里处理。
- [x] 统一处理 `startFen`：默认是标准开局，无需存储。
- [x] 禁止在任何 tree 结构内持久化 FEN。
- [x] 添加最小单元测试占位（如果当前项目不跑测试，写 TODO 注释）。
- [x] 在 `patch/docs/summary/Codex_stage03.md` 写完成报告。

## 依赖安装

已安装 `chess.js` 作为依赖：
```bash
npm install chess.js
```

## 实现的函数

### patch/chessJS/replay.ts

#### `replaySanPath(moves: string[], startFen?: string): ReplayResult`

回放 SAN 着法序列，返回：
```typescript
interface ReplayResult {
  board: Chess | null;      // chess.js 棋盘实例
  historySan: string[];     // 成功回放的 SAN
  historyFen: string[];     // 每步之后的 FEN
  illegalMoveIndex: number; // 第一个非法着法索引 (-1 表示全部合法)
  error: string | null;     // 错误信息
  finalFen: string;         // 最终 FEN
}
```

#### `validateMove(fen: string, san: string): ValidateMoveResult`

验证单个着法：
```typescript
interface ValidateMoveResult {
  valid: boolean;
  san: string | null;       // 规范化的 SAN
  uci: string | null;       // UCI 格式
  fenAfter: string | null;  // 着法后的 FEN
  error: string | null;
}
```

#### `replayMove(board: Chess, san: string): ReplayMoveResult`

回放单步着法，返回结果对象（不吞错）：
```typescript
interface ReplayMoveResult {
  success: boolean;
  move: Move | null;        // chess.js Move 对象
  fenAfter: string | null;  // 着法后的 FEN
  error: string | null;     // 错误信息
}
```

#### `replayMoves(board: Chess, moves: string[]): ReplayMovesResult`

回放多步着法：
```typescript
interface ReplayMovesResult {
  success: boolean;
  results: ReplayMoveResult[];  // 每步结果
  firstFailureIndex: number;    // 第一个失败索引 (-1 表示全成功)
  finalFen: string;
}
```

#### 其他函数
- `getValidMoves(fen: string): string[]` - 获取所有合法着法
- `createReplayState(startFen?: string): CreateReplayStateResult` - 创建 chess.js 实例（返回 `{ board, error }`）

### patch/chessJS/fen.ts

#### `fenFromPath(moves: string[], startFen?: string): FenFromPathResult`

从着法路径计算 FEN：
```typescript
interface FenFromPathResult {
  success: boolean;
  fen: string | null;
  error: string | null;
  illegalMoveIndex: number;
}
```

#### FEN 工具函数
- `parseFen(fen: string): FenParts | null` - 解析 FEN 组件
- `validateFen(fen: string): FenValidationResult` - 验证 FEN 有效性
- `composeFen(parts: FenParts): string` - 组合 FEN 字符串
- `isStartingPosition(fen: string): boolean` - 检查是否起始位置
- `getTurn(fen: string): 'w' | 'b' | null` - 获取行棋方
- `getFullmoveNumber(fen: string): number | null` - 获取回合数
- `getHalfmoveClock(fen: string): number | null` - 获取半回合计数

## 错误处理

非法 SAN 返回明确错误，不吞错：

```typescript
// 非法着法
{
  illegalMoveIndex: 1,
  error: 'Illegal move "e4" at index 1'
}

// 无效 SAN 格式
{
  illegalMoveIndex: 1,
  error: 'Invalid SAN "xyz" at index 1: ...'
}

// 无效起始 FEN
{
  illegalMoveIndex: -1,
  error: 'Invalid starting FEN: ...'
}
```

## StudyContext 错误处理

在 `studyContext.tsx` 中实现了完整的错误处理机制：

### 错误类型
```typescript
type StudyErrorType =
  | 'REPLAY_ERROR'   // 回放 SAN 时出错（非法着法、无效 SAN）
  | 'INVALID_FEN'    // 无效起始 FEN
  | 'LOAD_ERROR'     // 加载 study/chapter 失败
  | 'SAVE_ERROR';    // 保存失败
```

### 错误接口
```typescript
interface StudyError {
  type: StudyErrorType;
  message: string;
  context?: Record<string, unknown>;  // 额外上下文（如 illegalMoveIndex）
  timestamp: number;
}
```

### 上下文 API
- `replayPath(moves, startFen?)` - 回放路径并自动设置错误状态
- `setError(type, message, context?)` - 显式设置错误
- `clearError()` - 清除错误
- `hasReplayError()` - 检查是否有回放错误

### 状态管理
使用 `useReducer` 实现，错误在以下情况自动设置：
- `SET_REPLAY_RESULT` action 检测到 `result.error` 时
- 手动调用 `setError`

## startFen 处理

- 默认使用 `STARTING_FEN` (标准开局)
- 自定义 startFen 仅在运行时使用，不存储在 tree.json
- startFen 存储在 chapter 元数据 (Postgres)

## 硬性约束遵守

1. **chess.js 只做 replay/合法性校验**: 所有功能都是无状态计算
2. **FEN 只在运行态缓存**: 计算结果不持久化
3. **tree.json 禁止出现 FEN**: 前面阶段已确保 TreeMeta 和 StudyNode 无 FEN 字段

## 单元测试占位

在 `replay.ts` 和 `fen.ts` 文件末尾添加了 TODO 注释，列出所有应测试的场景：
- 有效着法回放
- 非法着法处理
- 无效 SAN 格式
- 自定义 startFen
- FEN 解析/验证/组合

## Vite 配置

为了让 patch 目录能正确引用 `chess.js`，在 `vite.config.ts` 中添加了：

```typescript
resolve: {
  alias: {
    "chess.js": path.resolve(__dirname, "node_modules/chess.js"),
  },
  dedupe: ["react", "react-dom", "react-router-dom", "chess.js"],
},
optimizeDeps: {
  include: ["react", "react-dom", "react-router-dom", "chess.js"],
},
```

## 编译验证

```
vite v5.4.21 building for production...
✓ 100 modules transformed.
✓ built in 724ms
```

## 后续阶段

- Stage 04: 实现 StudyContext 状态管理，使用这些函数计算 FEN
- Stage 05: 实现树操作，每次操作后通过 replay 计算新 FEN
