# Stage 06 Completion Report: StudyBoard Component

## 1. 核心产出
- **`patch/board/studyBoard.tsx`**:
    - 封装了 `react-chessboard`。
    - 实现了 `onPieceDrop` 交互逻辑。
    - 集成了 "分析入口" 按钮占位。
- **`patch/chessJS/replay.ts`**:
    - 新增 **`getMoveSan(fen, from, to)`** 辅助函数，用于将 UI 的拖拽动作转换为 SAN 字符串。

## 2. 交互逻辑
- **走子流程**:
    1. 用户拖动棋子 (`onPieceDrop`)。
    2. 调用 `getMoveSan` 基于当前 `state.currentFen` 校验合法性并计算 SAN。
    3. 若非法，调用 `setError('REPLAY_ERROR', ...)` 反馈并返回 `false`，棋子自动回弹（Snap back）。
    4. 若合法，调用 `StudyContext.addMove(san)` 分发动作。
    5. Context 更新 State，重新计算 FEN。
    6. Board 接收新的 `state.currentFen` 并重绘。
- **合法性校验**:
    - 完全依赖 `chess.js` (通过 `getMoveSan`) 进行规则判断。
    - 非法移动不会触发 `addMove`，确保 Tree 数据的一致性。

## 3. 约束遵守情况
- **Frontend Only**:
    - 仅在 UI 层使用 `react-chessboard` 和 `chess.js`。
    - 所有的状态变更均通过 `useStudy` 的 Dispatch 流程，未直接修改 Tree。
- **FEN Source**:
    - Board 的 `position` 属性严格绑定到 `state.currentFen`，该值由 Replay 计算得出，不读取任何持久化的 FEN 字段。

## 4. 依赖管理
- 在 `frontend/web/package.json` 中添加了 `react-chessboard` (v4.x) 依赖，以适配 React 18 环境。

## 5. 下一步 (Stage 07)
- Stage 06 完成了棋盘交互。
- Stage 07 将构建 `MoveTree` UI，展示棋谱树结构并支持导航。
