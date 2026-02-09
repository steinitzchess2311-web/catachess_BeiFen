# Deployment Checklist - 部署检查清单

## 部署前检查

### 1. 代码修改验证
- [x] requirements.txt 已添加 gunicorn>=21.0
- [x] railway.json 已更新启动命令（使用 gunicorn）
- [x] 数据库连接池配置已优化（pool_size=20, max_overflow=40）
- [x] MongoDB 连接池配置已优化（maxPoolSize=50）
- [x] 用户注册改为后台任务（BackgroundTasks）
- [x] 添加了性能监控端点 /api/metrics

### 2. 本地测试（可选）
```bash
# 安装依赖
pip install -r requirements.txt

# 本地启动（测试 gunicorn）
gunicorn backend.main:app \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000

# 测试健康检查
curl http://localhost:8000/health

# 测试性能监控
curl http://localhost:8000/api/metrics
```

---

## 部署步骤

### Step 1: 提交代码到 Git
```bash
git status
git add .
git commit -m "feat: optimize backend performance

- Add gunicorn multi-worker support (4 workers)
- Optimize database connection pool (20+40 connections)
- Optimize MongoDB connection pool (50 connections)
- Move workspace initialization to background tasks
- Add performance metrics endpoint /api/metrics

Fixes: #issue-number (网站卡顿，2-3人就崩溃)"

git push origin main
```

### Step 2: Railway 自动部署
- Railway 会自动检测到代码推送
- 开始构建新镜像（约 2-3 分钟）
- 自动重启服务

### Step 3: 监控部署进度
在 Railway Dashboard 中查看：
1. Build Logs（构建日志）
2. Deploy Logs（部署日志）
3. 等待状态变为 "Active"

---

## 部署后验证

### 1. 基础健康检查
```bash
# 检查服务是否启动
curl https://api.catachess.com/health

# 预期响应：
# {"status":"healthy","database":"connected","service":"Catachess API"}
```

### 2. 性能监控检查
```bash
# 查看性能指标
curl https://api.catachess.com/api/metrics | jq

# 重点检查：
# - database.pool_status 应该是 "healthy"
# - engine_queue.status 应该是 "healthy"
# - mongodb_cache.enabled 应该是 true
```

### 3. 功能测试
- [ ] 用户注册流程正常
- [ ] 用户登录流程正常
- [ ] 棋局分析功能正常
- [ ] Workspace 加载正常

### 4. 并发压力测试
```bash
# 使用 Apache Bench 测试
ab -n 100 -c 10 https://api.catachess.com/health

# 预期结果：
# - Requests per second: > 50
# - 所有请求成功（0 failed）
# - 95% 请求 < 500ms
```

---

## 监控指标

### 第一天：每小时检查一次
```bash
curl https://api.catachess.com/api/metrics | jq '{
  db_pool: .database.pool_status,
  db_connections: .database.checked_out_connections,
  queue_status: .engine_queue.status,
  queue_size: .engine_queue.queue_size
}'
```

### 正常值参考：
- `db_pool`: "healthy"
- `db_connections`: < 15（在 pool_size=20 的情况下）
- `queue_status`: "healthy"
- `queue_size`: < 5

### 异常值告警：
- 🔴 `db_pool`: "high_usage" → 连接池压力大
- 🔴 `db_connections`: > 18 → 接近连接池上限
- 🔴 `queue_status`: "high_queue" → 引擎队列积压
- 🔴 `queue_size`: > 10 → 需要优化

---

## 回滚方案（如果出现问题）

### 快速回滚到上一个版本
```bash
# 1. 回滚代码
git revert HEAD
git push origin main

# 2. Railway 会自动重新部署旧版本
```

### 临时禁用 Gunicorn（紧急情况）
在 Railway Dashboard 中修改环境变量：
```
OVERRIDE_START_COMMAND=/opt/venv/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

然后手动重启服务。

---

## 性能对比测试

### 测试场景 1: 单用户请求
```bash
# 测试健康检查端点响应时间
time curl https://api.catachess.com/health
```

**预期：**
- 之前：100-200ms
- 现在：50-100ms

### 测试场景 2: 并发请求
```bash
# 10 个并发请求
ab -n 50 -c 10 https://api.catachess.com/api/engine/analyze \
  -p analyze.json \
  -T application/json
```

**analyze.json:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 15,
  "multipv": 3
}
```

**预期：**
- 之前：大量超时，失败率 > 50%
- 现在：失败率 < 5%，平均响应时间 < 2 秒

### 测试场景 3: 用户注册
```bash
# 注册新用户
time curl -X POST https://api.catachess.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "SecurePassword123",
    "username": "testuser"
  }'
```

**预期：**
- 之前：2-3 秒（等待 workspace 初始化）
- 现在：< 500ms（立即返回，后台初始化）

---

## 数据收集

### 第一周每天记录
在 Google Sheets 或 Excel 中记录：

| 日期 | 时间 | 并发用户数 | DB连接数 | 队列长度 | 错误率 | 备注 |
|------|------|-----------|---------|---------|--------|------|
| 2/9  | 10:00 | ? | ? | ? | ? | 部署后第一次检查 |
| 2/9  | 14:00 | ? | ? | ? | ? | |
| 2/9  | 18:00 | ? | ? | ? | ? | |

### 自动化监控脚本（可选）
```bash
#!/bin/bash
# monitor.sh - 每 5 分钟记录一次性能指标

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  METRICS=$(curl -s https://api.catachess.com/api/metrics)

  echo "$TIMESTAMP,$METRICS" >> metrics.log

  sleep 300  # 5 分钟
done
```

---

## 常见问题排查

### Q1: 部署后服务无法启动
**检查：**
```bash
# 查看 Railway 日志
# 常见错误：
# - gunicorn 未安装 → 检查 requirements.txt
# - 启动命令错误 → 检查 railway.json
```

### Q2: 数据库连接失败
**检查：**
```bash
# 在 Railway Dashboard 检查：
# - DATABASE_URL 环境变量是否存在
# - PostgreSQL 插件是否正常运行
```

### Q3: MongoDB 缓存不工作
**检查：**
```bash
curl https://api.catachess.com/api/metrics | jq '.mongodb_cache'

# 如果显示 error，检查：
# - MONGO_URL 环境变量
# - MongoDB 插件状态
```

### Q4: Worker 进程崩溃
**检查：**
```bash
# Railway 日志中查找：
# - "worker timeout"
# - "out of memory"
# - Python 异常堆栈

# 解决方案：
# 1. 增加 --timeout 参数（如果是超时）
# 2. 减少 worker 数量（如果是内存不足）
# 3. 检查代码中的内存泄漏
```

---

## 成功指标

### ✅ 部署成功的标志：
1. ✅ `/health` 返回 200 OK
2. ✅ `/api/metrics` 返回完整数据
3. ✅ `database.pool_status` 为 "healthy"
4. ✅ `engine_queue.status` 为 "healthy"
5. ✅ 用户可以正常注册和登录
6. ✅ 10 个并发请求无失败

### 🎯 性能改善目标：
- 并发用户容量：2-3 人 → **20-30 人**
- 注册响应时间：2-3 秒 → **< 500ms**
- 健康检查响应：100-200ms → **< 100ms**
- 引擎分析成功率：< 50% → **> 95%**

---

## 下一步行动

### 如果部署成功：
1. ✅ 通知团队新版本已上线
2. ✅ 监控性能指标 24 小时
3. ✅ 收集用户反馈
4. ✅ 一周后评估是否需要进一步调优

### 如果出现问题：
1. 🔴 立即执行回滚方案
2. 🔴 收集错误日志
3. 🔴 分析根本原因
4. 🔴 修复后重新部署

---

## 联系方式

如果部署过程中遇到问题：
1. 查看 Railway 部署日志
2. 检查本文档的"常见问题排查"部分
3. 联系开发团队

**祝部署顺利！** 🚀
