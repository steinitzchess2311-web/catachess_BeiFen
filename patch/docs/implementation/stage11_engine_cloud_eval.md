Stage 11 - 引擎改为 Lichess Cloud Eval

目标
- 所有引擎分析调用改为 `https://lichess.org/api/cloud-eval`，不再使用现有多点引擎池。

必须参照的代码路径
- `backend/routers/chess_engine.py`
- `backend/core/chess_engine/client.py`
- `backend/core/chess_engine/orchestrator/*`

硬性约束
- 引擎返回结果不持久化。

- 失败时必须有明确 fallback（例如仅返回合法走子）。

进度记录
- 完成一个 checkbox 立刻打勾。
- 完成整 stage 后必须在 `patch/docs/summary/Codex_stage11.md` 写报告。

Checklist
- [x] 在 `backend/routers/chess_engine.py` 替换为 Cloud Eval 代理逻辑。
- [x] Cloud Eval 请求必须包含 `fen`，并支持 `multiPv` 参数。
- [x] 处理 Lichess rate limit（429）并返回可读错误。
- [x] 移除/冻结 `core/chess_engine/orchestrator` 的调用路径（保留文件不删）。
- [x] 更新 `backend/core/chess_engine/client.py` 为 Cloud Eval 客户端或弃用它。
- [x] 在 `backend/core/config.py` 添加新的配置项（例如 `LICHESS_CLOUD_EVAL_URL`）。
- [x] 文档化“引擎结果不写入 DB/R2”的约束。
- [x] 在 `patch/docs/summary/Codex_stage11.md` 写完成报告。
