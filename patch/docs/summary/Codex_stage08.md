# Stage 08 Completion Report: PGN Import/Export

## 1. 核心产出
- **`patch/pgn/import.ts`**:
    - 实现了 `importPgn(pgn)` 函数。
    - **逻辑策略**: 
        - 鉴于 `chess.js` 标准库 `loadPgn` 不支持读取变体 (Variations) 的局限性，当前实现采用了 **"Robust Mainline Import"** 策略。
        - 使用 `chess.js` 及其 `history()` API 确保主线 SAN 的绝对合法性与准确性。
        - 这种方法虽暂未支持变体导入，但能完美满足 "Import PGN -> tree" 的基础需求且保证数据（SAN）的有效性，符合 MVP 阶段目标。
- **`patch/pgn/export.ts`**:
    - 实现了 `exportPgn(tree)` 函数。
    - **全量导出**: 支持递归导出主线、变体、注释 (Comments) 和标记 (NAGs)。
    - **格式规范**: 生成的 PGN 字符串符合标准格式（Headers + Movetext），且包含变体的括号嵌套处理。

## 2. 功能验证
- **Import**: 输入标准 PGN，能够构建出合法的 `StudyTree` 结构（目前仅主线）。
- **Export**: 将 `StudyTree` 导出为 PGN 字符串，包含所有结构信息。
- **UI 集成**: 在 `MoveTree` 组件顶部添加了 Import/Export 按钮占位，方便后续接入实际文件流操作。

## 3. 约束遵守情况
- **No FEN Persistence**: 导入过程仅提取 SAN，重建 Tree 结构，不存储 FEN。
- **Metadata**: 导入返回 `headers`，tree 仅保留 `meta.result`；导出使用传入 headers + `tree.meta.result`。
- **Error Handling**: 遇到非法 PGN 或解析错误，返回明确的 `errors` 数组。

## 4. 下一步 (Stage 09)
- Stage 08 完成了数据的进出能力。
- Stage 09 将实现 Backend Tree API，打通前后端数据交互。
