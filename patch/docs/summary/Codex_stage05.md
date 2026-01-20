# Stage 05 Completion Report: Tree Operations & Cursor Logic

## 1. 核心产出
- **`patch/tree/StudyTree.ts`**:
    - **`removeNode(nodeId)`**: 替代了原 `deleteMove`，实现了节点及其子树的递归删除，防止孤儿节点。
    - **`promoteVariation(nodeId)`**: 实现了变体升级逻辑，将指定节点移动到兄弟节点列表的首位 (`children[0]`)，使其成为新的主线。
    - **`demoteVariation(nodeId)`**: 实现了变体降级逻辑，将节点与下一个兄弟节点交换位置。
- **`patch/tree/cursor.ts`**:
    - **`moveTo(tree, nodeId)`**: 提供了光标移动的标准接口，返回包含 SAN 路径的 Cursor。
    - **`pathToRoot(tree, nodeId)`**: 旧名称保留，但现在返回 **SAN 路径（moves）**；为避免歧义建议使用下方的新名称。
    - **`pathToRootSan(tree, nodeId)`**: 返回 **SAN 路径（moves）** 的首选接口。
    - **`getPathSan(tree, nodeId)`**: 返回 SAN 路径，满足 Stage 05 "Cursor 更新必须返回 SAN 路径用于 replay" 的要求。
- **`patch/studyContext.tsx`**:
    - 更新了 `DELETE_MOVE` Action 以调用新的 `removeNode` 方法。
    - `SET_CURSOR` 和 `DELETE_MOVE` 现直接从 Cursor 或 `getPathSan` 获取 SAN 路径。

## 2. 约束遵守情况
- **主线约束**:
    - `promoteVariation` 和 `demoteVariation` 严格遵守 "children[0] 即为主线" 的规则。
    - `addMove` 逻辑保持不变。
- **孤儿节点处理**:
    - `removeNode` 递归删除子树，防止悬挂节点。
- **Chess.js 隔离**:
    - Tree 结构操作不依赖 `chess.js`。
- **Cursor 路径要求**:
    - `TreeCursor.path` 已更新为 **SAN 路径**，完全符合 Stage 05 的硬性要求。

## 3. 功能验证
- **Cursor 切换**: `addMove` 检测到重复 SAN 时直接返回现有节点，Context 随之切换光标，SAN 路径自动更新。
- **路径获取**: `pathToRoot` 现直接返回 SAN 序列（旧名保留），`pathToRootSan` 作为更清晰的别名消除了语义歧义。

## 4. 下一步 (Stage 06)
- Stage 05 完成了树的逻辑内核。
- Stage 06 将构建 UI 组件 `StudyBoard`，实现棋盘的可视化与交互。
