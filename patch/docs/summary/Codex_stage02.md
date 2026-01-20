# Stage 02 - Tree 数据结构与版本机制 完成报告

## 目标
定义 tree.json 的结构与版本规则，确保"只存 SAN，不存 FEN"。

## 完成状态

### Checklist

- [x] 在 `patch/tree/type.ts` 定义 `StudyTree`, `StudyNode`, `TreeMeta` 类型。
- [x] 在 `patch/tree/type.ts` 定义 `TREE_SCHEMA_VERSION` 常量（默认 `"v1"`）。
- [x] 明确 root 结构：必须有虚拟 root 节点（root 不含 SAN）。
- [x] 节点字段列出最小集合：`id`, `parentId`, `san`, `children[]`, `comment`, `nags[]`。
- [x] 指定"分支顺序"规则（mainline 永远是 children[0]）。
- [x] 在 `patch/tree/type.ts` 增加 `validateTree(tree)` 的签名（可空实现，但必须定义）。
- [x] 写清楚"版本升级策略"注释（遇到旧版本时强制升级）。
- [x] 明确 `TreeMeta` 中的 `headers` 仅用于 PGN 导出（非持久化）。
- [x] 在 `patch/docs/summary/Codex_stage02.md` 写完成报告。

## Schema 定义

### StudyNode 字段（最小集合）

```typescript
interface StudyNode {
  id: string;           // 节点唯一 ID
  parentId: string | null;  // 父节点 ID，root 为 null
  san: string;          // SAN 着法，root 为空字符串
  children: string[];   // 子节点 ID 数组，children[0] = mainline
  comment: string | null;   // 注释
  nags: number[];       // NAG 符号数组
}
```

**关键约束：无 FEN 字段！** FEN 通过 chess.js replay 按需计算。

### StudyTree 顶层结构（tree.json 内容）

```typescript
interface StudyTree {
  version: 'v1';        // 必须有 version 字段
  rootId: string;       // 根节点 ID
  nodes: Record<string, StudyNode>;  // 所有节点
  meta: TreeMeta;       // 元数据
}
```

### TreeMeta 结构

```typescript
interface TreeMeta {
  result: string | null;  // 比赛结果 "1-0", "0-1", "1/2-1/2", "*"
}
```

**不存储在 tree.json 中的数据：**
- `setupFen` (起始 FEN) → 存储在 chapter 元数据 (Postgres)
- `headers` (PGN 头) → 从 study/chapter 元数据重建，导出时使用

## 虚拟 Root 节点

- 每棵树必须有一个虚拟 root 节点
- root 节点特征：
  - `san = ""` (空字符串)
  - `parentId = null`
  - `children[0]` 指向第一个实际着法

## 分支顺序规则

- `children[0]` **永远是** mainline（主线）
- `children[1..n]` 是变着，按创建顺序排列
- 提升变着 = 交换 children 中的位置

## 版本升级策略

```
加载 tree 时检查 version 字段：
- version < TREE_SCHEMA_VERSION: 强制执行升级迁移
- version > TREE_SCHEMA_VERSION: 拒绝（不兼容的未来版本）
- version === TREE_SCHEMA_VERSION: 直接加载

迁移函数位于 patch/tree/migrations/（按需添加）
```

## validateTree 函数

实现的检查：
- 检查 version 字段匹配当前版本
- 检查 rootId 存在且指向有效节点
- 检查 root 节点结构（parentId = null, san = ""）
- 检查所有 children 引用指向存在的节点
- 检查所有 parentId 引用指向存在的节点

未实现的检查（可在后续阶段添加）：
- 孤儿节点检测
- 循环引用检测

## 硬性约束遵守

1. **只存 SAN，禁止 FEN**: StudyNode 无 FEN 字段，TreeMeta 无 setupFen 字段
2. **tree.json 有 version 字段**: StudyTree.version 为必填
3. **Postgres 不存 tree 内容**: tree 结构设计用于 R2/文件存储
4. **headers 不持久化**: TreeMeta 不含 headers，导出时从 study/chapter 元数据重建

## 编译验证

```
vite v5.4.21 building for production...
✓ 98 modules transformed.
✓ built in 610ms
```

## 后续阶段

- Stage 03: 实现 chess.js replay 和 FEN 计算
- Stage 05: 实现完整的树操作（添加/删除节点、提升变着等）
