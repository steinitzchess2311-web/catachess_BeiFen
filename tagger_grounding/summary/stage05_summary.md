# Stage 05 Summary - 后端 API 与服务层

## 完成内容

### 1. API 路由（对齐 Stage 02）

| 方法 | 路径 | 用途 | 实现 |
|------|------|------|------|
| POST | /api/tagger/players | 创建棋手 | ✓ |
| GET | /api/tagger/players | 获取棋手列表 | ✓ |
| GET | /api/tagger/players/:id | 获取单个棋手 | ✓ |
| POST | /api/tagger/players/:id/uploads | 上传 PGN | ✓ |
| GET | /api/tagger/players/:id/stats | 获取统计 | ✓ |
| GET | /api/tagger/players/:id/exports | 导出（csv/json） | ✓ |

### 2. 服务层职责
1. 接收上传 → 写 R2 → 创建 upload 记录 ✓
2. 触发解析 pipeline（待 Stage 06）
3. 写入统计与失败记录 ✓
4. 返回进度与状态 ✓

### 3. error_code 枚举（已固定）

| 错误码 | 含义 |
|--------|------|
| INVALID_PGN | PGN 格式无效 |
| HEADER_MISSING | 缺少必要 header |
| MATCH_AMBIGUOUS | 匹配不唯一 |
| ENGINE_TIMEOUT | 引擎超时 |
| ENGINE_503 | 引擎服务不可用 |
| ILLEGAL_MOVE | 非法走子 |
| UNKNOWN_ERROR | 未知错误 |

### 4. API 返回字段最小集
- status, processed_positions, failed_games_count
- last_updated, needs_confirmation, match_candidates

### 5. 导出 API 参数
- format: csv/json
- upload_ids（可选）
- from_date / to_date（可选）

## 代码实现

| 文件 | 行数 | 职责 |
|------|------|------|
| backend/routers/tagger.py | 191 | API 路由 |
| backend/services/tagger_service.py | 159 | 服务层 |
| backend/schemas/tagger.py | 120 | 请求/响应模型 |
| backend/modules/tagger/__init__.py | 11 | 模块导出 |
| backend/modules/tagger/errors.py | 49 | 错误码枚举 |

## 集成
- main.py 已注册 tagger router
- routers/__init__.py 已导出 tagger
- models/__init__.py 已导出 tagger models

## Checklist 完成状态
- [x] API 路径对齐
- [x] 服务层职责清晰
- [x] 返回字段最小集合确认
- [x] **代码已实现**

## 下一步
进入 Stage 06：Pipeline 实现（PGN → tag）
