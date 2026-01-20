Stage 05 - Tree 操作与 Cursor 逻辑

目标
- 实现 StudyTree 与 Cursor 的核心操作，确保分支与主线规则一致。

必须参照的代码路径
- `patch/tree/type.ts`
- `patch/tree/StudyTree.ts`
- `patch/tree/cursor.ts`

硬性约束
- 主线必须是 `children[0]`。

- 删除节点时必须处理孤儿节点（禁止悬挂）。
- Tree 操作不得依赖 chess.js。

进度记录
- 完成一个 checkbox 立刻打勾。
- 完成整 stage 后必须在 `patch/docs/summary/Codex_stage05.md` 写报告。

Checklist
- [x] 在 `patch/tree/StudyTree.ts` 实现 `addMove(parentId, san)`。
- [x] `addMove` 若已有同 SAN 子节点，直接切换 cursor，不重复创建。
- [x] 在 `patch/tree/StudyTree.ts` 实现 `removeNode(nodeId)`，包含子树删除。
- [x] 在 `patch/tree/StudyTree.ts` 实现 `promoteVariation(nodeId)`（变体提为主线）。
- [x] 在 `patch/tree/StudyTree.ts` 实现 `demoteVariation(nodeId)`（主线降级）。
- [x] 在 `patch/tree/cursor.ts` 实现 `moveTo(nodeId)` + `pathToRoot(nodeId)`。
- [x] Cursor 更新必须返回 SAN 路径用于 replay。
- [x] 为每个操作写清楚约束注释（例如不能操作 root）。
- [x] 在 `patch/docs/summary/Codex_stage05.md` 写完成报告。
