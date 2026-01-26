我是一名经验丰富的 coder；完成后请按本文件自检并逐项打勾验收。

一句话目标：实现黑盒适配器与 split/blackbox 的可切换入口。

## 约束（必须遵守）
- 不动前端，不动 API schema。
- 不改变现有 split tagger 的行为与输出。
- 黑盒调用必须进程内 import（方案 1）。
- 必须支持 `BLACKBOX_TAGGER_PATH` 作为可配置路径。
- 不能在黑盒模块外做 `sys.path` 注入。

## 实现步骤
1. 新建 `backend/core/blackbox_tagger/__init__.py`，导出 `tag_position`。
2. 新建 `backend/core/blackbox_tagger/adapter.py`：
   - 读取 `BLACKBOX_TAGGER_PATH`（可选）并注入 `sys.path`。
   - import `rule_tagger2.core.facade.tag_position`。
   - 传入与 split 相同的参数。
   - 返回 `TagResult` 兼容对象。
3. 拆分 `backend/core/tagger/facade.py`：
   - 创建 `backend/core/tagger/facade_split.py` 放原逻辑。
   - `facade.py` 仅保留一行 import 切换。
4. 黑盒输出适配：
   - 如果黑盒返回 TagResult 兼容对象，补齐缺失字段。
   - 如果返回 dict，构造本地 TagResult。
   - 统一 `analysis_context` 结构，保留黑盒 meta。
5. 记录 active tagger 类型到 `analysis_context`，便于回归对比。

## 验收清单（全部勾完即通过）
- [ ] `backend/core/blackbox_tagger/__init__.py` 正确暴露 `tag_position`。
- [ ] `adapter.py` 支持 `BLACKBOX_TAGGER_PATH` 并避免外部污染。
- [ ] 进程内 import 成功时无需子进程调用。
- [ ] `facade.py` 只需要改一行 import 即可切换实现。
- [ ] `facade_split.py` 完整保留旧逻辑，行为不变。
- [ ] 黑盒输出缺字段时能补齐默认值（bool=False, float=0.0, dict={}).
- [ ] 黑盒异常时报错清晰，包含缺失路径/依赖提示。
- [ ] 不修改任何 API 路由与响应结构。
- [ ] `analysis_context` 中记录当前 tagger 类型。
