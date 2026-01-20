Stage 07 - 走法树 UI 与 Sidebar

目标
- 实现走法树 UI，与 cursor 选中一致，支持分支切换。

必须参照的代码路径
- `patch/sidebar/movetree.tsx`
- `patch/tree/StudyTree.ts`
- `patch/studyContext.tsx`

硬性约束
- 走法树 UI 只读取 tree，不自行生成变体。

- 选中节点必须与 cursor 同步。

进度记录
- 完成一个 checkbox 立刻打勾。
- 完成整 stage 后必须在 `patch/docs/summary/Codex_stage07.md` 写报告。

Checklist
- [x] `patch/sidebar/movetree.tsx` 能递归渲染树结构。
- [x] 主线与变体的视觉区分必须明显（缩进 + 样式）。
- [x] 点击节点触发 `SET_CURSOR`。
- [x] 显示每个节点的 SAN（不要显示 FEN）。
- [x] 支持显示注释/标记（comment/nags，如果有）。
- [x] 为“当前节点”增加高亮样式。
- [x] 切换分支时，Board 与树同步刷新。
- [x] 在 `patch/docs/summary/Codex_stage07.md` 写完成报告。
