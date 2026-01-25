# Stage 06 - Pipeline 实现（PGN → Tag 统计）

目标：实现核心处理逻辑。

## 一、执行步骤
1) 读取 R2 raw.pgn
2) 解析 PGN（仅主线）
3) 对每盘做 player 匹配
4) 遍历走子：仅统计目标棋手走子
5) 调用 tagger
6) 记录 tag 命中
7) 更新白/黑/总统计
8) 记录失败盘

## 二、主线定义
- 使用 chess.pgn 的 variation(0) 作为主线。
- 变体全部忽略（v1）。

## 三、统计写入策略
- 推荐“先累加到内存，再一次性写入”。
- 锁策略：按 player_id + upload_id 维度做细粒度锁，避免不同上传互相阻塞。
- 写入时使用事务：校验去重表后再写入统计增量。

## 四、任务分片与断点续跑
- 每批处理固定盘数（如 50 盘一批）。
- 每批结束写入 checkpoint。
- worker 中断后从 checkpoint 继续。

## 五、checkpoint 落地规则（必须固定）
- 存储位置：Postgres 表 `pgn_uploads` 新增字段 `checkpoint_state`（jsonb）。
- 内容：last_game_index、processed_game_hashes（最近 N 条）、updated_at。
- 过期策略：upload 完成后清理 checkpoint_state。
- 大文件策略：processed_game_hashes 仅保留最近 N 条，完整去重由 `pgn_games` 表保障。

## Checklist
- [ ] R2 读取流程定义清晰
- [ ] 主线解析规则确认
- [ ] 只统计目标棋手走子
- [ ] 统计写入策略确认
- [ ] 失败盘记录机制确认
