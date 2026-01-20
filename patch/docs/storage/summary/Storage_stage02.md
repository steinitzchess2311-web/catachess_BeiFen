# Stage 02 Completion Report: Save UX Feedback

## 1. Save 状态显示
- **`patch/PatchStudyPage.tsx`**:
    - 显示 Saving... / Unsaved changes / Saved at 时间戳。
- **`patch/sidebar/movetree.tsx`**:
    - Save 按钮增加 Saving... 状态与禁用逻辑。

## 2. Save 状态逻辑
- **`patch/studyContext.tsx`**:
    - 新增 `isSaving` 字段。
    - 保存时设置 Saving 状态，完成后恢复。

## 3. 约束符合
- 保存失败不阻塞编辑，错误通过现有 Error banner 展示。
- 自动保存仍为 debounce，不产生高频 UI 抖动。
