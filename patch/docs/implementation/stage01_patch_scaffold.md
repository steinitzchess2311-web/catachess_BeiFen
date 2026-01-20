Stage 01 - Patch 基础骨架与入口切换

目标
- 创建 patch 目录结构，并在前端建立入口，保证 patch 可以独立挂载。

范围
- 只做目录/入口/路由的“空壳”，不写业务逻辑。

必须参照的代码路径
- 旧 study 模块：`frontend/ui/modules/study/*`
- 新 patch 根目录：`patch/*`

硬性约束
- patch 下所有模块必须以“可替换”为前提，禁止直接修改 legacy 逻辑。

- patch 入口必须能在本地页面单独渲染，不依赖 legacy PGN。

进度记录
- 完成一个 checkbox 立刻打勾。
- 完成整 stage 后必须在 `patch/docs/summary/Codex_stage01.md` 写报告。

Checklist（全部打勾才算完成）
- [x] 新建 `patch/studyContext.tsx` 空壳（导出 Provider + hook），只保留类型占位。
- [x] 新建 `patch/board/studyBoard.tsx` 空壳组件（只渲染容器，不接入逻辑）。
- [x] 新建 `patch/tree/*`（type.ts, StudyTree.ts, cursor.ts）空文件，占位并导出接口。
- [x] 新建 `patch/pgn/import.ts` 与 `patch/pgn/export.ts` 空文件，占位并导出接口。
- [x] 新建 `patch/chessJS/replay.ts` 与 `patch/chessJS/fen.ts` 空文件，占位并导出接口。
- [x] 新建 `patch/sidebar/movetree.tsx` 空壳组件。
- [x] 在 `frontend` 新增路由/入口，将 study 页面切到 patch（保留 legacy 入口用于对比）。
- [x] 添加"入口开关"配置（例如环境变量或显式路由），确保可以回退。
- [x] 所有新建文件必须有最基本的导出语句，确保编译不报错。
- [x] 在 `patch/docs/summary/Codex_stage01.md` 写完成报告（文件名必须包含 Codex）。
