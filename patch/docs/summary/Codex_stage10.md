# Stage 10 Completion Report: R2 Storage Migration

## 1. 核心产出
- **`patch/backend/study/migration.py`**:
    - 实现了 `migrate_all_chapters` 函数，批量将存量 PGN 转换为 Tree JSON 格式。
    - 逻辑：下载 PGN -> 解析为 NodeTree -> 转换为 StudyTreeDTO -> 上传 tree.json -> 更新 DB 元数据 (r2_key)。
- **`backend/modules/workspace/domain/services/pgn_sync_service.py`**:
    - **修改同步逻辑**: `sync_chapter_pgn` 不再生成和上传 PGN 快照，仅上传 `tree.json` 和 `fen_index.json`。
    - **元数据更新**: `chapter.r2_key` 现在指向 `.tree.json` 文件，`pgn_hash` 等字段复用于校验 Tree JSON 内容。
- **`backend/modules/workspace/api/endpoints/studies.py`**:
    - **Lazy Migration / Read**: `get_chapter_pgn` 端点现在智能判断 `r2_key` 后缀。
        - 若为 `.json`: 下载 Tree JSON 并实时转换为 PGN 返回（Export on Read）。
        - 若为 `.pgn`: 下载原始 PGN 返回（Legacy）。
- **`patch/backend/study/converter.py`**:
    - 提取了 `convert_nodetree_to_dto` 逻辑，确保迁移脚本和潜在的运行时转换逻辑复用。

## 2. 存储架构变更
- **Before**: R2 `chapters/{id}.pgn` 是权威数据源。
- **After**: R2 `chapters/{id}.tree.json` 是权威数据源。PGN 仅作为导出格式动态生成，不再占用存储空间（除旧数据备份外）。
- **兼容性**: 
    - 数据库 `chapter_id` 保持不变。
    - `r2_key` 字段平滑过渡，支持混合状态（部分章节已迁移，部分未迁移）。

## 3. 约束遵守情况
- **Chapter ID Alignment**: 严格使用 `R2Keys.chapter_tree_json(chapter_id)`，未引入新目录结构。
- **Postgres Schema**: 未修改 Postgres 表结构，复用现有 `r2_key` 和 `pgn_status` 字段。
- **Write Path**: 编辑操作（Add Move, etc.）现在通过 `sync_service` 仅写入 Tree JSON，实现了写路径的切换。

## 4. 下一步 (Stage 11)
- Stage 10 完成了存储层的现代化改造。
- Stage 11 将集成引擎评估（Stockfish/Cloud Eval），为分析功能提供支持。
