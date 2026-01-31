# Position Precomputation System

自动预计算系统，在用户分析局面后自动计算后续可能的局面，提升分析体验。

## 功能特性

### 1. 横向预计算（Horizontal Expansion）
分析完局面 A 后，自动预计算：
- 一选着法后的局面 B
- 二选着法后的局面 C
- 三选着法后的局面 D
- 四选着法后的局面 E
- 五选着法后的局面 F

### 2. 纵向预计算（Vertical Expansion）
沿着主要变化深入计算：
- 一选的一选（深度 1）
- 一选的一选的一选（深度 2）
- 二选的一选（深度 1）
- ...以此类推

### 3. 智能优先级
- 一选优先级最高（100）
- 二选次之（90）
- 三到五选递减（80, 70, 60）
- 纵向深度递减（50, 40, 30）

### 4. 多层缓存存储
所有预计算结果存入：
1. **Memory Cache** - 立即可用（0.1ms）
2. **IndexedDB** - 持久化本地（5-10ms）
3. **MongoDB** - 全局共享（后端自动处理）

## 控制台日志

系统会在浏览器控制台输出非常详细的日志，帮助调试和监控：

### 触发阶段
```
================================================================================
[PRECOMPUTE MANAGER] 🚀 Trigger started
[PRECOMPUTE MANAGER] FEN: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RN...
[PRECOMPUTE MANAGER] Depth: 20, MultiPV: 3
[PRECOMPUTE MANAGER] Lines: 3
================================================================================

[PRECOMPUTE MANAGER] Extracting horizontal tasks | MaxLines: 5
[MOVE PARSER] Extracting next positions | FEN: rnbq... | Lines: 3 | MaxLines: 5
[MOVE PARSER] Processing Line 1 | Move: e2e4 | PV length: 5 | Score: 25
[MOVE PARSER] ✓ Line 1 extracted | Move: e4 (e2e4) | New FEN: rnbq...
[MOVE PARSER] Processing Line 2 | Move: d2d4 | PV length: 5 | Score: 20
[MOVE PARSER] ✓ Line 2 extracted | Move: d4 (d2d4) | New FEN: rnbq...
[MOVE PARSER] ✓ Extraction complete | Extracted 3 positions from 3 lines
[PRECOMPUTE MANAGER] ✓ Extracted 3 horizontal positions
```

### 队列处理
```
================================================================================
[PRECOMPUTE MANAGER] ▶️ Starting queue processing
[PRECOMPUTE MANAGER] Queue size: 8
[PRECOMPUTE MANAGER] Total: 8 | Horizontal: 3 | Vertical: 5 | Pending: 8
================================================================================

[PRIORITY QUEUE] ✓ Task inserted | Priority: 100 | Position: 1/8 | Move: e2e4 | Line: 1 | TreeDepth: 0
[PRIORITY QUEUE] ✓ Task inserted | Priority: 90 | Position: 2/8 | Move: d2d4 | Line: 2 | TreeDepth: 0
```

### 任务执行
```
--------------------------------------------------------------------------------
[PRECOMPUTE MANAGER] ▶️ Executing task
[PRECOMPUTE MANAGER] Move: e2e4
[PRECOMPUTE MANAGER] Line: 1
[PRECOMPUTE MANAGER] TreeDepth: 0
[PRECOMPUTE MANAGER] Priority: 100
[PRECOMPUTE MANAGER] FEN: rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/...
--------------------------------------------------------------------------------

[PRECOMPUTE STORAGE] Checking if should precompute | FEN: rnbq... | Depth: 20 | MultiPV: 3
[PRECOMPUTE STORAGE] ✓ Should precompute | FEN: rnbq...
[PRECOMPUTE MANAGER] 🔄 Calling engine API...
[MONGODB CACHE] ✗ MISS in 2.8ms | engine=450ms | store=4.2ms | total=520ms
[PRECOMPUTE MANAGER] ✓ Engine returned | Lines: 3 | Source: SFCata
[PRECOMPUTE STORAGE] Storing result | Move: e2e4 | Line: 1 | TreeDepth: 0
[PRECOMPUTE STORAGE] ✓ Memory cache updated | Key: fen:rnbq...
[PRECOMPUTE STORAGE] ✓ IndexedDB updated | Key: fen:rnbq...
[PRECOMPUTE STORAGE] ✓ Storage complete | Duration: 15ms | Move: e2e4

--------------------------------------------------------------------------------
[PRECOMPUTE MANAGER] ✅ Task completed | Duration: 535ms | Move: e2e4 | Line: 1
--------------------------------------------------------------------------------
```

### 缓存命中
```
[PRECOMPUTE STORAGE] Checking if should precompute | FEN: rnbq... | Depth: 20 | MultiPV: 3
[PRECOMPUTE STORAGE] ✗ Skip (memory hit) | Key: fen:rnbq...
[STATS] Cache hit | Hit rate: 37.5% | Key: fen:rnbq...
```

### 完成总结
```
================================================================================
[PRECOMPUTE MANAGER] ✓ Queue processing complete
================================================================================

================================================================================
[STATS] PRECOMPUTE SUMMARY
================================================================================
Total triggered:     8
  - Horizontal:      3
  - Vertical:        5
Completed:           6
Failed:              0
Cancelled:           0
Cache hit rate:      25.0%
Avg duration:        487ms
Total time saved:    2s
Last updated:        10:30:45 AM
================================================================================
```

### MongoDB 缓存日志
预计算的结果也会触发 MongoDB 缓存日志：
```
[MONGODB CACHE] ✗ MISS in 2.8ms | engine=450ms | store=4.2ms | total=520ms
[MONGODB CACHE] ✓ HIT in 2.5ms | hit_count=1 | cached_at=2026-01-31 00:17:45 | total=15ms
```

## 配置选项

```typescript
interface PrecomputeSettings {
  enabled: boolean;           // 启用/禁用（默认：true）
  horizontalDepth: 1 | 3 | 5; // 横向深度：1/3/5 选（默认：5）
  verticalDepth: 0 | 1 | 2;   // 纵向深度：0/1/2 层（默认：2）
  delayMs: number;            // 延迟启动毫秒数（默认：100）
  maxConcurrent: 1 | 2;       // 最大并发任务（默认：1）
}
```

### 修改设置
```typescript
import { updatePrecomputeSettings } from '@/engine/precompute';

// 只预计算 3 条变化，不做纵向
updatePrecomputeSettings({
  horizontalDepth: 3,
  verticalDepth: 0,
});

// 禁用预计算
updatePrecomputeSettings({
  enabled: false,
});
```

## 性能影响

### 用户体验提升
- **首次分析**：500ms（正常）
- **点击一选**：5ms（从 500ms 降低到 5ms，提升 100 倍）
- **点击二选**：5ms（同上）
- **点击三选**：5ms（同上）

### 引擎负载
- 每次用户分析触发 5-10 个预计算任务
- 预计算在后台执行，不阻塞用户操作
- 单并发（maxConcurrent: 1）避免抢占用户主动请求

### 全局收益
- 所有预计算结果存入 MongoDB
- 全球所有用户共享同一个计算结果库
- 随着使用增加，缓存命中率持续提升

## 取消机制

系统会在以下情况自动取消预计算：
- 用户切换到新局面
- 用户关闭分析面板
- 页面卸载/关闭
- 单个任务超时（30秒）

## 错误处理

预计算失败**不会**影响主流程：
- 网络错误 → 跳过，继续下一个
- 引擎错误 → 跳过，记录日志
- IndexedDB 错误 → 降级到内存，警告日志
- 所有错误都会有详细的控制台日志

## 文件结构

```
patch/engine/precompute/
├── index.ts          # 导出入口
├── manager.ts        # 核心管理器
├── queue.ts          # 优先级队列
├── task.ts           # 任务类型定义
├── move-parser.ts    # 着法解析（chess.js）
├── storage.ts        # 存储逻辑
├── stats.ts          # 统计和监控
├── types.ts          # TypeScript 类型
└── README.md         # 本文档
```

## 统计 API

```typescript
import { getPrecomputeStats, printPrecomputeSummary } from '@/engine/precompute';

// 获取统计数据
const stats = getPrecomputeStats();
console.log('总触发次数:', stats.totalTriggered);
console.log('完成数:', stats.completed);
console.log('缓存命中率:', (stats.cacheHitRate * 100).toFixed(1) + '%');

// 打印详细总结
printPrecomputeSummary();
```

## 调试建议

1. **打开浏览器控制台**（F12）
2. **过滤日志**：搜索 `[PRECOMPUTE]` 或 `[MOVE PARSER]`
3. **查看队列状态**：搜索 `Queue size`
4. **监控任务执行**：搜索 `Executing task`
5. **检查缓存命中**：搜索 `Cache hit`
6. **查看总结**：搜索 `SUMMARY`

## 依赖

- `chess.js` ^1.4.0 - 用于着法解析和 FEN 验证

## 作者

CataChess Team - 2026
