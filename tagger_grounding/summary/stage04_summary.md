# Stage 04 Summary - Postgres 表结构与索引

## 完成内容

### 1. 表结构（5 张表）

| 表名 | 用途 | 主要字段 |
|------|------|----------|
| player_profiles | 棋手档案 | id, display_name, normalized_name, aliases |
| pgn_uploads | 上传记录 | id, player_id, r2_key_raw, checksum, status, checkpoint_state |
| pgn_games | 对局记录 | id, player_id, upload_id, game_hash, player_color, move_count |
| failed_games | 失败记录 | id, player_id, upload_id, game_hash, error_code, error_message, retry_count |
| tag_stats | 标签统计 | player_id, scope, tag_name, tag_count, total_positions, engine_version, depth, multipv |

### 2. 索引与约束

| 表 | 类型 | 字段 |
|----|------|------|
| player_profiles | index | (normalized_name) |
| pgn_uploads | index | (player_id) |
| pgn_games | unique | (player_id, game_hash) |
| pgn_games | index | (upload_id) |
| tag_stats | index | (player_id, scope) |
| tag_stats | unique | (player_id, scope, tag_name, stats_version, engine_version, depth, multipv) |
| failed_games | index | (player_id, upload_id) |

### 3. 统计口径确认
- `total_positions` = 该棋手走子总步数（与 Stage 01 口径一致）

## 代码实现

| 文件 | 行数 | 职责 |
|------|------|------|
| backend/models/tagger.py | 128 | ORM 模型定义 |
| backend/alembic/versions/006_create_tagger_tables.py | 115 | 数据库迁移 |

## Checklist 完成状态
- [x] 表结构字段确认
- [x] 约束与索引确认
- [x] 统计口径字段 total_positions 明确为"该棋手走子总步数"
- [x] **代码已实现**

## 下一步
进入 Stage 05：后端 API + 服务层
