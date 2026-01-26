我是一名经验丰富的 coder；完成后请按本文件自检并逐项打勾验收。

一句话目标：验证黑盒与 split 的可切换性与输出一致性，并形成回归基线。

## 约束（必须遵守）
- 验证只做只读对比，不改算法。
- 对比必须覆盖 tag 列表、关键字段、输出结构。
- 任何差异必须记录为已知差异或 bug。

## 验证步骤
1. 选择 5-10 个代表性 FEN/PGN 样本（不同阶段/局面类型）。
2. 分别在 split 与 blackbox 模式调用 `tag_position`。
3. 对比结果：
   - `TagResult` 字段是否齐全
   - `tags` 列表/主标签是否一致
   - `analysis_context` 中实现标记是否正确
4. 记录差异：
   - 可接受差异（规则差异）
   - 不可接受差异（缺字段/崩溃/空输出）
5. 产出小型对比报告（文件名建议：`backend/core/blackbox_tagger/docs/implementation/COMPARISON_NOTES.md`）

## 验收清单（全部勾完即通过）
- [ ] split 与 blackbox 都能成功运行并返回 `TagResult`。
- [ ] 输出字段完整，无 KeyError 或类型错。
- [ ] 前端/接口消费者无需改动即可读取结果。
- [ ] 差异已分类并记录，且无阻断级问题。
- [ ] 一行切换机制验证通过。
- [ ] 已生成对比记录文件（如 `COMPARISON_NOTES.md`）。
