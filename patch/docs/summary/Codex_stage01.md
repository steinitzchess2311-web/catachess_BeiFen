# Stage 01 - Patch 基础骨架与入口切换 完成报告

## 目标
创建 patch 目录结构，并在前端建立入口，保证 patch 可以独立挂载。

## 完成状态

### Checklist

- [x] 新建 `patch/studyContext.tsx` 空壳（导出 Provider + hook），只保留类型占位。
- [x] 新建 `patch/board/studyBoard.tsx` 空壳组件（只渲染容器，不接入逻辑）。
- [x] 新建 `patch/tree/*`（type.ts, StudyTree.ts, cursor.ts）空文件，占位并导出接口。
- [x] 新建 `patch/pgn/import.ts` 与 `patch/pgn/export.ts` 空文件，占位并导出接口。
- [x] 新建 `patch/chessJS/replay.ts` 与 `patch/chessJS/fen.ts` 空文件，占位并导出接口。
- [x] 新建 `patch/sidebar/movetree.tsx` 空壳组件。
- [x] 在 `frontend` 新增路由/入口，将 study 页面切到 patch（保留 legacy 入口用于对比）。
- [x] 添加"入口开关"配置（例如环境变量或显式路由），确保可以回退。
- [x] 所有新建文件必须有最基本的导出语句，确保编译不报错。
- [x] 在 `patch/docs/summary/Codex_stage01.md` 写完成报告（文件名必须包含 Codex）。

## 创建的文件结构

```
patch/
├── index.ts                    # 模块导出桶文件
├── studyContext.tsx            # Context Provider + hook (空壳)
├── PatchStudyPage.tsx          # 主页面组件
├── board/
│   └── studyBoard.tsx          # 棋盘空壳组件
├── tree/
│   ├── type.ts                 # 类型占位 (无 FEN/uci, 待 Stage02 定义)
│   ├── StudyTree.ts            # 类占位 (待 Stage02 实现)
│   └── cursor.ts               # 函数占位 (待 Stage02 实现)
├── pgn/
│   ├── import.ts               # PGN 导入函数占位
│   └── export.ts               # PGN 导出函数占位
├── chessJS/
│   ├── replay.ts               # 走子重放函数占位
│   └── fen.ts                  # FEN 解析函数占位
├── sidebar/
│   └── movetree.tsx            # 棋谱树空壳组件
├── styles/
│   └── index.css               # 基础样式
└── docs/summary/
    └── Codex_stage01.md        # 本报告
```

## 硬性约束遵守

1. **节点只存 SAN**: tree/type.ts 中的 TreeNode 为空接口占位，不含 FEN/uci 字段，实际 schema 由 Stage02 定义
2. **可替换原则**: patch 模块完全独立，未修改任何 legacy 代码逻辑
3. **独立渲染**: patch 入口可在本地页面单独渲染，不依赖 legacy PGN

## 前端路由配置

- Legacy 入口: `/workspace/:id`
- Patch 入口: `/patch/workspace/:id`
- 入口开关: `VITE_USE_PATCH_STUDY=true` 环境变量

## Vite 配置更新

- 添加 `@patch` 路径别名
- 配置 `server.fs.allow` 允许访问 patch 目录
- 添加 `resolve.dedupe` 和 `optimizeDeps.include`

## 编译验证

```
vite v5.4.21 building for production...
✓ 98 modules transformed.
✓ built in 606ms
```

## 后续阶段

Stage 02 将定义实际的 tree schema（节点只存 SAN，FEN 通过 replay 计算）。
