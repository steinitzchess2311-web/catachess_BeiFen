# Stage 09 Completion Report: Backend Tree API

## 1. 核心产出
- **`patch/backend/study/models.py`**:
    - 使用 Pydantic 定义了 `StudyTreeDTO` 及其嵌套模型。
    - 启用了 `extra="forbid"` 配置，严格禁止 FEN 或其他未定义字段进入模型，满足“PUT tree 时必须拒绝任何 FEN 字段”的硬性约束。
- **`patch/backend/study/api.py`**:
    - 实现了 `GET /chapter/{chapter_id}/tree`: 从 R2 下载并返回 `tree.json`。
    - 实现了 `PUT /chapter/{chapter_id}/tree`: 将校验过的 `tree.json` 上传至 R2，校验 `version` + 结构完整性（rootId、root.san、父子引用）。
    - 实现了 `GET /chapter/{chapter_id}/pgn-export`: 从 R2 中的 `tree.json` 动态生成 PGN 字符串并返回。
- **集成与挂载**:
    - 修改了 `backend/main.py`，将项目根目录加入 `sys.path`，确保 `patch` 模块可被后端正常导入。
    - 修改了 `backend/modules/workspace/api/endpoints/studies.py`，挂载了新的 `study-patch` 路由。

## 2. 架构设计落实
- **存储对齐**: 严格使用 `R2Keys.chapter_tree_json(chapter_id)` 生成存储路径，确保与现有存储体系一致。
- **数据解耦**: 后端不再依赖 Postgres 存储树结构，而是利用 R2 作为高并发读写的文档存储，Postgres 仅保留章节元数据。
- **PGN 转换**: 在 Python 后端实现了针对 `StudyTree` 结构的 PGN 构建器，支持递归处理变体、注释和 NAGs，确保导出功能的完整性。

## 3. 约束遵守情况
- **No FEN Persistence**: 通过 Pydantic 模型层强制过滤 FEN 字段。
- **Versioning**: 显式校验 `version: "v1"`，为未来迁移留出余地。
- **Headers 来源**: PGN headers 由 chapter 元数据提供（Event/White/Black/Date/Result），tree.json 不存 headers。
- **R2 Keys**: 统一遵循 `R2Keys` 命名规范。

## 4. 下一步 (Stage 10)
- Stage 09 完成了后端的读写能力。
- Stage 10 将启动大规模的 R2 存储迁移，将存量 PGN 转换为 Tree JSON 格式。
