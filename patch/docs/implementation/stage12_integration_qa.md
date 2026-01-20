Stage 12 - 全量集成与质量保障

目标
- 端到端串通：前端 tree 编辑 -> 后端 R2 tree.json -> 导出 PGN -> 引擎云分析。

必须参照的代码路径
- 前端入口：`frontend/...`（patch 入口）
- Patch 核心：`patch/*`
- 后端 API：`patch/backend/study/api.py`

硬性约束
- tree.json 是唯一持久化结构。

- 不允许把 FEN 写进 tree.json。

进度记录
- 完成一个 checkbox 立刻打勾。
- 完成整 stage 后必须在 `patch/docs/summary/Codex_stage12.md` 写报告。

Checklist
- [x] 集成测试路径：导入 PGN -> 生成 tree -> 编辑 -> 写回 R2。
- [x] 验证“同 chapter 单 tree”：多章节切换不混树。
- [x] 验证 tree.json version 升级流程（旧版本导入）。
- [x] 验证导出 PGN 与原 PGN 的主要走法一致。
- [x] 验证 Cloud Eval API 正常返回，失败有明确提示。
- [x] 增加最小日志埋点（tree 写入、导出、引擎调用）。
- [x] 更新开发文档（README 或 docs）指向新入口。
- [x] 在 `patch/docs/summary/Codex_stage12.md` 写完成报告。
