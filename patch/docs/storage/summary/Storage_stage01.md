# Stage 01 Completion Report: Save Entry + Auto-save

## 1. 核心产出
- **`patch/studyContext.tsx`**:
    - 新增 `isDirty` 与 `lastSavedAt` 状态字段。
    - `ADD_MOVE` / `DELETE_MOVE` 置 `isDirty=true`。
    - 增加 `saveTree()`，调用 `PUT /study-patch/chapter/{chapter_id}/tree`。
    - 增加 15s debounce 自动保存（仅在 `isDirty=true` 时触发）。
- **`patch/sidebar/movetree.tsx`**:
    - 添加手动 Save 按钮，触发 `saveTree()`。

## 2. 约束符合
- 仅持久化 tree.json，无 FEN 写入。
- Auto-save 仅在脏数据时触发，失败不会清除 `isDirty`。

## 3. 功能验证
- 手动 Save 成功后 `isDirty=false`，`lastSavedAt` 记录时间戳。
- 自动保存在树变更后延迟触发。
