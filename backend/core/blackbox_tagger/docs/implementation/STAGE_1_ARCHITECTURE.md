我是一名经验丰富的 coder；完成后请按本文件自检并逐项打勾验收。

一句话目标：确定黑盒接入的整体架构与切换机制，并锁定不变的对外接口。

## 约束（必须遵守）
- 不改任何前端接口、不改任何对外 API schema。
- `backend/core/tagger/facade.py` 必须可一行切换实现。
- 输出必须与当前 `TagResult` 结构一致（字段名与类型）。
- 默认行为保持现有 split tagger 不变。
- 任何黑盒失败必须给出清晰错误信息，不允许 silent fallback。

## 架构落地计划
1. 识别当前 tagger 入口与被调用链路。
2. 定义新的目录结构：`backend/core/blackbox_tagger` 作为黑盒入口。
3. 设计切换方式：一行 import 或环境变量开关（优先一行 import）。
4. 定义黑盒适配边界：只在黑盒模块内处理依赖路径、输出适配。
5. 输出适配规则：保证 `TagResult` 字段齐全且类型一致。

## 验收清单（全部勾完即通过）
- [ ] 已确认当前 `backend/core/tagger/facade.py` 的对外签名与调用点。
- [ ] 新架构不改变任何 API/前端对接字段。
- [ ] `backend/core/tagger/facade.py` 仅需一行 import 即可切换 split/blackbox。
- [ ] 黑盒模块集中在 `backend/core/blackbox_tagger`，不散落到 tagger 目录。
- [ ] 黑盒模块清楚标注输入/输出契约。
- [ ] 已写明默认行为仍为 split tagger。
- [ ] 已定义黑盒异常的处理策略（必须显式报错）。
- [ ] 已定义需要保留的 `analysis_context/notes` 的处理方式。
- [ ] 变更范围未触及前端与 API 层代码。
