# Stage 04 Completion Report: StudyContext & Global State

## 1. 核心产出
- **`patch/studyContext.tsx`**: 完成了全局状态管理，实现了 Tree + Cursor + FEN 的联动，以及 **Undo** 支持。
- **`patch/tree/StudyTree.ts`**: 补充了 `addMove` 和 `deleteMove` 方法，支持树的动态修改。
- **`patch/PatchStudyPage.tsx`**: 添加了 UI 错误提示横幅，确保非法操作能反馈给用户。

## 2. 架构设计落实
**数据流**:
    - `StudyState` 持有 `StudyTreeData` (纯数据) 和 `history` 栈。
    - **FenCache**: 使用 `useRef` 保存 transient cache，不进入 `StudyState/history`，避免持久化 FEN。
    - Reducer 中实例化 `StudyTree` 类进行操作，操作后更新 State。
    - 每次 Tree 变更或 Cursor 移动，触发 `replaySanPath` 计算当前 FEN，并利用 Ref Cache 优化性能。
- **不可变性**:
    - 使用 `JSON.parse(JSON.stringify(tree))` 进行深拷贝，并在 `createSnapshot` 中对 State 进行完整克隆，确保 Reducer 纯函数特性。
- **约束遵守**:
    - Tree 中不存储 FEN。
    - `chess.js` 仅用于 Replay 计算，不直接写入 Tree。
    - `ADD_MOVE` 逻辑严格代理给 `StudyTree.addMove()`。
    - Action 命名严格遵守文档：`DELETE_MOVE` 以及对应的 `StudyTree.deleteMove`。

## 3. 功能点详情
- **ADD_MOVE**:
    - 自动检测重复移动，复用现有节点。
    - 自动更新 Path 与 FEN。
    - 自动压入 History 栈。
- **DELETE_MOVE**:
    - 调用 `StudyTree.deleteMove`。
    - 智能 Cursor 修正：删除当前节点时自动回退到父节点。
    - 自动压入 History 栈。
- **UNDO**:
    - 恢复到上一个 State 快照（Tree + Cursor + FEN）。
- **SET_CURSOR**:
    - 校验 Node ID 存在性。
    - 优先检查 Ref Cache。
- **UI Error Hint**:
    - 在 `PatchStudyPage.tsx` 中实现了错误横幅展示，当 SAN 非法或 Replay 失败时，用户能看到具体的错误信息。

## 4. 下一步 (Stage 05)
- Stage 04 已完成 Tree 的基础增删改、Undo 支持及 UI 错误提示。
- Stage 05 将完善 Tree 的更多操作（如 Promote Variation, Comment, NAGs）以及 Cursor 的高级导航。
