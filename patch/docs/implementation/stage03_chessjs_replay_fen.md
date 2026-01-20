Stage 03 - chess.js 回放与 FEN 生成

目标
- 实现 chess.js 的回放工具与 FEN 生成工具，但严格不持久化。

必须参照的代码路径
- chess.js 仅前端使用（不依赖后端规则引擎）。
- 旧 FEN 计算参考：`backend/core/real_pgn/fen.py`

硬性约束
- chess.js 只做 replay/合法性校验。

- FEN 只在运行态缓存，tree.json 中禁止出现 FEN。

进度记录
- 完成一个 checkbox 立刻打勾。
- 完成整 stage 后必须在 `patch/docs/summary/Codex_stage03.md` 写报告。

Checklist
- [x] 在 `patch/chessJS/replay.ts` 实现 `replaySanPath(moves: string[], startFen?: string)`。
- [x] `replaySanPath` 返回 `{ board, historySan, illegalMoveIndex }` 类似结构。
- [x] 在 `patch/chessJS/fen.ts` 实现 `fenFromPath(moves: string[], startFen?: string)`。
- [x] 为非法 SAN 返回明确错误（不要吞错），并在 StudyContext 里处理。
- [x] 统一处理 `startFen`：默认是标准开局，无需存储。
- [x] 禁止在任何 tree 结构内持久化 FEN。
- [x] 添加最小单元测试占位（如果当前项目不跑测试，写 TODO 注释）。
- [x] 在 `patch/docs/summary/Codex_stage03.md` 写完成报告。
