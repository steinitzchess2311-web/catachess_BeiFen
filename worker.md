# CataChess Worker 架构改造计划（详细版）

> 目标：解决 API “黑洞/超时”、CORS 误报、HTTP/2 协议错误等现象，确保 Web 永远可用；将 Stockfish 与 tagger pipeline 全部迁移到 Worker 层。

---

## 1. 背景与问题链路（现象→原因）

### 1.1 现象（已观测）
- 浏览器报 CORS 预检失败（Provisional headers / No ACAO）。
- curl 预检/health 请求：TLS + HTTP/2 建连成功，但 **0 bytes received** 超时。
- Railway edge 可达，证书匹配域名，但 **应用无响应**。
- 重新 deploy 会短暂恢复，过一阵又“黑洞”。

### 1.2 归因结论
- 不是 CORS 头缺失，而是 **应用层没有返回任何响应**。
- FastAPI 端口监听存在，但 **应用未 ready** 或被 **长任务阻塞/卡死**。
- 核心原因：**长耗时引擎任务（Stockfish / tagger）运行在 Web 进程**。

---

## 2. 改造目标

1) **Web 永远稳定**  
   - /health 秒回  
   - 无论后台任务多少，HTTP 请求不被阻塞  

2) **计算任务隔离**  
   - Stockfish 与 tagger pipeline 完全移出 Web  
   - Worker 崩溃不会影响 Web 服务  

3) **可扩展**  
   - 通过增加 Worker 横向扩容  
   - 单 Worker 内受控并发，避免资源爆炸  

---

## 3. 总体架构（方案）

```
Browser
  ↓
Web API (FastAPI)
  ↓ enqueue
Job Queue (Postgres)
  ↓ pull
Worker Service (Stockfish + Tagger)
```

### 核心原则
- Web 不跑分析，不启动引擎。
- Worker 才是分析入口，且 **有并发上限**。
- 队列只负责排队，不提升并发。

---

## 4. 服务划分与启动方式

### 4.1 Web Service（现有服务）
**职责：**
- 接收用户请求、认证校验
- 入队分析任务
- 查询任务状态/结果

**禁忌：**
- 不启动 Stockfish
- 不执行 tagger pipeline
- 不在 startup/lifespan await 长任务

**Start Command：**
```
/opt/venv/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

### 4.2 Worker Service（新增服务）
**职责：**
- 轮询任务队列
- 执行 Stockfish 分析
- 执行 tagger pipeline
- 更新 job 状态与结果

**Start Command：**
```
python backend/worker.py
```

**说明：**
- 无 HTTP listener（可选加 /health 仅用于观察）

---

## 5. Job Queue（最小可用方案）

### 5.1 表结构建议（最简）
- `id` (UUID)
- `type` (`stockfish` / `tagger`)
- `status` (`queued` / `running` / `done` / `failed`)
- `payload` (JSON)
- `result` (JSON)
- `error` (text)
- `priority` (int)
- `created_at`, `updated_at`

### 5.2 拉取任务 SQL（并发安全）
```
SELECT * FROM jobs
WHERE status='queued'
ORDER BY priority, created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

---

## 6. Worker 并发控制

### 6.1 原则
- **排队而不是并发爆炸**
- Worker 内部并发必须受控

### 6.2 推荐初始并发
```
N = max(1, CPU 核数 / 2)
```

### 6.3 示例
```
sem = asyncio.Semaphore(N)

async with sem:
    await run_stockfish(job)
```

---

## 7. API 改造面（影响评估）

### 7.1 必须改
- 所有直接调用 Stockfish 引擎的路径
- 所有直接触发 tagger pipeline 的路径

### 7.2 调用协议变化
原：同步返回分析结果  
新：立即返回 `job_id` + status 轮询 / SSE

### 7.3 前端调整
- 轮询 `/jobs/{id}` 获取结果
- 或后续升级到 WebSocket / SSE

---

## 8. 风险点与防护

### 8.1 风险点
- Worker 任务卡死 → 并发槽耗尽
- 任务量暴增 → 队列堆积
- Worker 崩溃 → 任务未完成

### 8.2 防护措施
- **任务超时 / fail-safe**（超时标记 failed）
- **重试次数限制**
- **心跳机制**（worker 定期更新 running 任务时间戳）
- **监控与告警**（队列积压、worker 健康）

---

## 9. Tagger Pipeline 放置策略

### 9.1 结论
- tagger pipeline 必须在 Worker 层运行，不在 Web。
- 原因：长耗时/高 CPU/IO；放 Web 会重复触发“黑洞”。

### 9.2 建议模式
- 用户触发 → Web enqueue → Worker 执行 → 前端轮询
- 批量任务 → 独立 Worker + 手动/定时触发

---

## 10. 落地步骤（建议顺序，详细）

### 10.1 盘点与界面冻结（不改代码）
1) 列出所有 **Stockfish 调用入口**（API、服务层、脚本）。
2) 列出所有 **tagger pipeline 入口**（API、批处理、内部调用）。
3) 标记哪些接口属于 **同步返回**，哪些可以转为 **异步**。
4) 确认前端当前调用路径（哪些页面依赖同步分析）。

### 10.2 设计数据模型（最小可用）
1) 定义 `jobs` 表字段（见 5.1）。
2) 明确 `payload` / `result` 的 JSON 结构（Stockfish / tagger 各自的 schema）。
3) 定义 job 生命周期状态与错误码。

### 10.3 Web 层改造（最小侵入）
1) 为每个分析入口提供：
   - `POST /jobs`（enqueue）
   - `GET /jobs/{id}`（status/result）
2) 保留原接口但内部改成：
   - enqueue → 返回 job_id
   - 或提供 `?sync=false` 兼容
3) 保证 `/health` 与常规业务不受影响。

### 10.4 Worker 实现
1) 新增 `backend/worker.py`：
   - 连接 DB
   - 循环拉取 queued 任务
   - 标记 running → 执行 → done/failed
2) 并发控制：
   - 使用 `asyncio.Semaphore(N)`
   - N = CPU/2（初始）
3) 超时与保护：
   - 单任务超时（超过即 failed）
   - 失败次数限制（避免无限重试）

### 10.5 Railway 部署切分
1) Web Service：沿用原 start command。
2) Worker Service：新增服务，start command = `python backend/worker.py`。
3) 确认自定义域名只指向 Web Service。

### 10.6 前端适配（最小方案）
1) 发送分析请求后拿 `job_id`。
2) 每 1-2 秒轮询 `/jobs/{id}`。
3) 渲染状态：queued/running/done/failed。

### 10.7 稳定性与观测
1) Worker 心跳：定期更新 running 任务的 `updated_at`。
2) 监控队列积压量、失败率。
3) 确认 HTTP/2 请求稳定返回（curl/浏览器）。

---

## 11. 成功标准

- /health 秒回（< 200ms）
- 高并发请求不阻塞 Web
- Worker 崩溃不影响 Web
- CORS 预检稳定返回 200/204 + ACAO
