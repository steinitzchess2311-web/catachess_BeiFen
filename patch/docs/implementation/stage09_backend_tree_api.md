Stage 09 - 后端 Tree API

目标
- 提供 tree.json 的读写 API，并保证与 chapter_id 对齐。

必须参照的代码路径
- 新建：`patch/backend/study/models.py`, `patch/backend/study/api.py`
- R2 客户端：`backend/modules/workspace/storage/r2_client.py`
- R2 keys：`backend/modules/workspace/storage/keys.py`
- 旧 study 入口：`backend/modules/workspace/api/endpoints/studies.py`

硬性约束
- API 只能读写 tree.json；PGN 只用于导出端点。

- Postgres 不保存 tree 内容。

进度记录
- 完成一个 checkbox 立刻打勾。
- 完成整 stage 后必须在 `patch/docs/summary/Codex_stage09.md` 写报告。

Checklist
- [x] 在 `patch/backend/study/models.py` 定义 Tree DTO（含 `version`）。
- [x] 在 `patch/backend/study/api.py` 实现 GET/PUT `chapter/{chapterId}/tree`。
- [x] R2 key 必须使用 `R2Keys.chapter_tree_json(chapter_id)`。
- [x] API 必须校验 `version`，不合规则拒绝写入。
- [x] PUT tree 时必须拒绝任何 FEN 字段（严格校验）。
- [x] 新增导出接口 `chapter/{chapterId}/pgn-export`（从 tree 生成 PGN）。
- [x] 在 `backend/modules/workspace/api/endpoints/studies.py` 里挂载新路由或代理。
- [x] 在 `patch/docs/summary/Codex_stage09.md` 写完成报告。
