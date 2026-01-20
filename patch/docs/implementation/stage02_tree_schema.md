Stage 02 - Tree 数据结构与版本机制

目标
- 定义 tree.json 的结构与版本规则，确保“只存 SAN，不存 FEN”。

必须参照的代码路径
- 现有 NodeTree：`backend/core/real_pgn/models.py`
- 旧 PGN 解析（已弃用）：`backend/modules/workspace/pgn/serializer/to_tree.py`

硬性约束
- tree.json 顶层必须有 `version` 字段。

- 节点只存 SAN（必要时可保留 move number、ply、parent id）。禁止存 FEN。
- Postgres 不得存 tree 内容（不改 DB 表）。

进度记录
- 完成一个 checkbox 立刻打勾。
- 完成整 stage 后必须在 `patch/docs/summary/Codex_stage02.md` 写报告。

Checklist
- [x] 在 `patch/tree/type.ts` 定义 `StudyTree`, `StudyNode`, `TreeMeta` 类型。
- [x] 在 `patch/tree/type.ts` 定义 `TREE_SCHEMA_VERSION` 常量（默认 `"v1"`）。
- [x] 明确 root 结构：必须有虚拟 root 节点（root 不含 SAN）。
- [x] 节点字段列出最小集合：`id`, `parentId`, `san`, `children[]`, `comment`, `nags[]`。
- [x] 指定"分支顺序"规则（mainline 永远是 children[0]）。
- [x] 在 `patch/tree/type.ts` 增加 `validateTree(tree)` 的签名（可空实现，但必须定义）。
- [x] 写清楚"版本升级策略"注释（遇到旧版本时强制升级）。
- [x] 明确 `TreeMeta` 不含 `headers`；headers 从 study/chapter 元数据重建（tree.json 不存）。
- [x] 在 `patch/docs/summary/Codex_stage02.md` 写完成报告。
