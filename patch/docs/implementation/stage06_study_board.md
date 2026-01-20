Stage 06 - StudyBoard 组件与走子交互

目标
- 用 react-chessboard 封装 StudyBoard，接入 onPieceDrop 与合法性校验。

必须参照的代码路径
- `patch/board/studyBoard.tsx`
- `patch/chessJS/replay.ts`
- `patch/studyContext.tsx`

硬性约束
- 前端走子必须通过 StudyContext.dispatch。

- chess.js 只用作校验，不得在 UI 里直接修改 tree。

进度记录
- 完成一个 checkbox 立刻打勾。
- 完成整 stage 后必须在 `patch/docs/summary/Codex_stage06.md` 写报告。

Checklist
- [x] 在 `patch/board/studyBoard.tsx` 引入 react-chessboard 并封装 props。
- [x] `onPieceDrop(from, to)` 必须转换为 SAN（用 chess.js 从当前 FEN 推导）。
- [x] 非法走子必须阻止 dispatch，并显示用户反馈。
- [x] Board 渲染的 FEN 必须来自 replay 结果（cursor 路径）。
- [x] 渲染时禁止读取 tree 中的 FEN 字段（不存在）。
- [x] 在组件里加入“分析入口”按钮占位（不连引擎）。
- [x] 在 `patch/docs/summary/Codex_stage06.md` 写完成报告。
