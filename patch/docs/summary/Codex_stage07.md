# Stage 07 Completion Report: MoveTree UI & Sidebar

## 1. 核心产出
- **`patch/sidebar/movetree.tsx`**:
    - 实现了基于递归的走法树渲染。
    - 区分了主线 (Mainline) 与变体 (Variations)。
    - 集成了点击切换 Cursor 逻辑。
    - 支持 NAGs (标记) 和注释图标显示。

## 2. UI 设计
- **主线展示**: 默认垂直向下延伸，字体加粗。
- **变体展示**: 
    - 使用左侧边框 (`borderLeft`) 和缩进进行视觉隔离。
    - 使用 `(variation)` 标签辅助识别。
    - 字体颜色较淡以区分主次。
- **状态同步**:
    - **当前节点**: 使用蓝色背景 (`#3b82f6`) 高亮。
    - **交互**: 点击任意节点调用 `selectNode`，自动更新全局 `cursorNodeId` 和 `currentFen`。
- **性能**:
    - 组件直接订阅 `StudyContext` 状态变化，确保 Board 和 Tree 同步刷新。

## 3. 约束遵守情况
- **Data Source**: UI 仅读取 `tree.nodes`，严格按照 `children[0]` 为主线的规则渲染。
- **No FEN in UI**: 仅显示 `san` 字段，不显示或读取 FEN。
- **State Flow**: 所有的选中操作均通过 `StudyContext.dispatch({ type: 'SET_CURSOR', ... })` 实现。

## 4. 下一步 (Stage 08)
- Stage 07 完成了走法树可视化。
- Stage 08 将实现 PGN 的导入与导出逻辑，连接外部数据。
