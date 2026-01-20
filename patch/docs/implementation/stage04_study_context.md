Stage 04 - StudyContext 全局状态

目标
- 建立 tree + cursor 的前端全局状态，支持 add/remove/undo 基础动作。

必须参照的代码路径
- 新入口：`patch/studyContext.tsx`
- Tree 操作接口：`patch/tree/StudyTree.ts`
- Cursor：`patch/tree/cursor.ts`

硬性约束
- context 中禁止持久化 FEN。

- chess.js 不得写入 tree，只能根据 tree 回放。

进度记录
- 完成一个 checkbox 立刻打勾。
- 完成整 stage 后必须在 `patch/docs/summary/Codex_stage04.md` 写报告。

Checklist
- [x] 在 `patch/studyContext.tsx` 定义 `StudyState`（tree + cursor + history + currentFen）。
- [x] `runtimeFenCache` 必须使用 `useRef`（不得进入 state/history）。
- [x] 定义 `StudyAction`：`ADD_MOVE`, `DELETE_MOVE`, `SET_CURSOR`, `LOAD_TREE`, `UNDO`。
- [x] reducer 中的 `ADD_MOVE` 必须调用 `StudyTree.addMove()`，不得自己造树。
- [x] reducer 中的 `SET_CURSOR` 必须校验 nodeId 是否存在。
- [x] 添加 `useStudyContext()` hook 与 Provider。
- [x] 提供 `loadTreeFromServer()` 占位，用于后续 API 接入。
- [x] 明确错误处理：非法 SAN 或 replay 失败必须在 UI 提示。
- [x] 在 `patch/docs/summary/Codex_stage04.md` 写完成报告。
