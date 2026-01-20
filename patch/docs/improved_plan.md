Catachess 迁移改进方案（精细化）

角色设定：我是负责上线质量的项目经理，默认所有实现都可能有坑。以下内容是“必须照做”的迁移方案，任何偏离都需要向我解释。

目标与硬性约束（复述，避免有人装傻）
- 这是 study（研讨）产品，不是对弈平台。
- PGN 仅用于导入/导出；本地存储与编辑必须是 tree 结构。
- chess.js 只做校验与 replay，不存结构。
- FEN 不长期存储，按需生成；节点只存 SAN（必要时保留 UCI 作为临时运行态，不入库）。
- 后端不参与走法计算（前端负责走法树与回放）。
- 单 chapter 单 tree；tree.json 必须带版本号。
- Postgres 永远不知道 tree 内容（保持现在的 variations/chapters 表结构不动）。
- R2 存储改为 tree.json，key 与 chapter_id 对齐（见 `backend/modules/workspace/storage/keys.py`）。
- 引擎调用改为 `https://lichess.org/api/cloud-eval`，返回不持久化。

现状与 legacy 代码锚点
- 旧 PGN/树处理：
  - `backend/modules/workspace/pgn/serializer/to_tree.py`（已标 DEPRECATED）
  - `backend/core/real_pgn/*`（NodeTree、解析/构建、fen 索引）
- R2 存储接口：
  - `backend/modules/workspace/storage/keys.py`（chapters/*.pgn、*.tree.json、*.fen_index.json）
  - `backend/modules/workspace/pgn_v2/repo.py`（PGN v2：pgn + tree + fen_index 上传）
  - `backend/modules/workspace/domain/services/pgn_sync_service.py`（同步 PGN + tree + FEN）
- 引擎接口：
  - `backend/routers/chess_engine.py`（API 路由）
  - `backend/core/chess_engine/*`（multi-spot 远端引擎）
- 前端 study 页面现状：
  - `frontend/ui/modules/study/*`（非 React，现有 study UI 模块）

核心改动策略（vertical slice）
1) 新建 `catachess/patch` 作为迁移 slice，禁止在 legacy 里到处散改。
2) patch 内的前后端以“同名、同语义”的模块组织，便于逐个替换：
   - 前端：`patch/studyContext.tsx`, `patch/board/studyBoard.tsx`, `patch/chessJS/*`, `patch/tree/*`, `patch/pgn/*`, `patch/sidebar/*`
   - 后端：`patch/backend/study/models.py`, `patch/backend/study/api.py`
3) 与 legacy 的连接方式：
   - 前端：在 `frontend` 中新增入口/路由，将 study 页面切换到 patch 的 React 组件。
   - 后端：保持 Postgres 表结构不变，只替换 R2 读写内容与 API 负载。
4) 旧 PGN 同步保留“导出”用途：
   - legacy PGN 仅作为导出/兼容；写入 R2 的主存为 tree.json。

目标文件结构（patch）
- `patch/studyContext.tsx`
  - 全局状态：tree + cursor + 运行态 FEN 缓存
  - 只存 SAN、node id，禁止存 FEN 到 tree
- `patch/chessJS/replay.ts`
  - chess.js 仅做 replay 与合法性校验
- `patch/chessJS/fen.ts`
  - fen 生成，只在运行态缓存
- `patch/tree/type.ts`
  - Node/Edge/Tree 类型定义 + schema 版本号
- `patch/tree/StudyTree.ts`
  - tree 操作：addMove/remove/promote/demote/reorder
- `patch/tree/cursor.ts`
  - cursor 操作 + 路径追踪（node id list）
- `patch/board/studyBoard.tsx`
  - React chessboard 包装 + onPieceDrop
- `patch/pgn/import.ts`
  - PGN -> tree
- `patch/pgn/export.ts`
  - tree -> PGN
- `patch/sidebar/movetree.tsx`
  - 走法树 UI，与 cursor 对齐
- `patch/backend/study/models.py`
  - Tree DTO（API 输入输出）+ 版本校验
- `patch/backend/study/api.py`
  - /study/{id}/chapter/{chapterId}/tree
  - /study/{id}/chapter/{chapterId}/pgn-export

与 legacy 的精确连接点
- R2 key 生成：沿用 `backend/modules/workspace/storage/keys.py`，重点使用 `R2Keys.chapter_tree_json(chapter_id)`。
- PGN v2 repo：`backend/modules/workspace/pgn_v2/repo.py` 需要改成“tree 为主、pgn 为导出”，并将 `save_snapshot_pgn` 从必选改为按需。
- PGN 同步服务：`backend/modules/workspace/domain/services/pgn_sync_service.py` 需要去掉“每次编辑都强制写 pgn”，改为“写 tree.json + fen_index（可选）”，导出时再生成 pgn。
- 引擎 API：`backend/routers/chess_engine.py` 与 `backend/core/chess_engine/*` 改为 Lichess Cloud Eval 代理（不存结果）。

树结构版本策略
- tree.json 顶层字段必须包含 `version`（字符串或整数，默认 "v1"）。
- 升级策略：保持向后兼容；遇到旧 version 必须在加载时升级并记录日志。

风险清单（必须跟进）
- 旧客户端仍在写 PGN：必须在 API 层拒绝或转换。
- R2 同步策略不一致：必须用 chapter_id 对齐 key，禁止自造路径。
- 前端走法树与后端不同步：必须通过 tree.json 的版本号与 hash 做一致性检查。

交付标准
- patch docs 的 Implementation 全部完成，能直接上线。
- 后端持久化只存 tree.json（PGN 仅导出）
- 前端 study 页面完全脱离 legacy PGN 的本地编辑逻辑。
