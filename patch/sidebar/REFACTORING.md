# StudySidebar 重构总结

## 概览

原 `StudySidebar.tsx` 从 **903 行**拆分为多个模块，主组件减少到 **300 行**。

## 新文件结构

```
patch/sidebar/
├── StudySidebar.tsx          # 主组件 (300行) ← 从 903 行缩减
├── ChapterList.tsx            # 已存在
├── components/                # UI 组件层
│   ├── AnalysisPanel.tsx      # Analysis 面板展示 (79行)
│   ├── AnalysisSettings.tsx   # Analysis 设置控件 (51行)
│   ├── ImitatorPanel.tsx      # Imitator 面板展示 (84行)
│   └── ImitatorSettings.tsx   # Imitator 设置控件 (107行)
├── hooks/                     # 业务逻辑层
│   ├── useEngineAnalysis.ts   # 引擎分析逻辑 (187行)
│   └── useImitator.ts         # Imitator 功能逻辑 (244行)
└── utils/                     # 工具函数层
    ├── formatters.ts          # 格式化工具 (59行)
    └── config.ts              # 配置函数 (15行)
```

## 拆分内容

### 1. **工具函数** (`utils/`)
- `formatters.ts`: 提取了所有格式化函数
  - `formatScore()`: 分数格式化
  - `formatSanWithMoveNumbers()`: 棋谱格式化
  - `formatProbability()`: 概率格式化
  - `formatTags()`: 标签格式化
- `config.ts`: 配置解析
  - `resolveTaggerBase()`: Tagger 服务地址
  - `FALLBACK_BACKOFF_MS`: 常量

### 2. **自定义 Hooks** (`hooks/`)
- `useEngineAnalysis.ts`: 引擎分析核心逻辑
  - 状态管理 (lines, status, error, health)
  - API 调用和轮询
  - 错误重试和回退
  - Precompute 取消逻辑
  - 性能日志

- `useImitator.ts`: Imitator 功能逻辑
  - Coach/Player 列表加载
  - 目标管理 (添加/删除)
  - 并发请求处理
  - 结果聚合

### 3. **UI 组件** (`components/`)
- `AnalysisSettings.tsx`: Depth/MultiPV/引擎开关
- `AnalysisPanel.tsx`: 分析结果展示
- `ImitatorSettings.tsx`: Coach/Player/Engine 选择
- `ImitatorPanel.tsx`: Imitator 结果卡片

### 4. **主组件** (`StudySidebar.tsx`)
现在只负责：
- Tab 切换状态
- 组合 hooks 和组件
- 性能监控（保留）
- UCI→SAN 转换（useMemo，保留在主组件因为依赖 `state.currentFen`）

## 优势

### ✅ 职责分离
- **逻辑层**：hooks 封装业务逻辑
- **展示层**：components 只负责 UI 渲染
- **工具层**：utils 提供纯函数

### ✅ 可维护性
- 每个文件职责单一
- 易于定位和修复问题
- 减少认知负担

### ✅ 可测试性
- hooks 可以独立测试
- formatters 是纯函数，易于测试
- 组件可以用模拟数据测试

### ✅ 可复用性
- `useEngineAnalysis` 可用于其他需要引擎分析的组件
- `useImitator` 可用于其他 Imitator 相关功能
- formatters 可在整个应用中使用

### ✅ 性能
- 逻辑封装在 hooks 中，优化更容易
- 组件更小，重渲染成本更低
- useMemo 依然在主组件优化格式化

## 向后兼容

- ✅ 所有功能保持一致
- ✅ Props 接口不变
- ✅ 性能日志保留
- ✅ 缓存机制保留

## 后续优化建议

1. **性能监控** 可以抽离为 `usePerformanceMonitor` hook
2. **UCI→SAN 转换** 可以考虑移入 `useEngineAnalysis`
3. **缓存逻辑** 可以从 hook 中进一步抽离
4. 考虑为 `formatters` 添加单元测试
5. 考虑为 hooks 添加集成测试
