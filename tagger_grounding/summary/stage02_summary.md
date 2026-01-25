# Stage 02 Summary - 架构设计与接口规范

## 完成内容

### 1. 分层原则确认
| 层级 | 职责 |
|------|------|
| backend/core | 保留单步 tagger 能力，不侵入 |
| backend/modules/tagger | pipeline 与存储调度 |
| patch/modules/tagger | 前端 UI 与 API 调用 |

### 2. API 列表（已冻结）
| 方法 | 路径 | 用途 |
|------|------|------|
| POST | /api/tagger/players | 新建棋手 |
| GET | /api/tagger/players | 获取棋手列表 |
| GET | /api/tagger/players/:id | 获取单个棋手 |
| POST | /api/tagger/players/:id/uploads | 上传 PGN |
| GET | /api/tagger/players/:id/stats | 获取统计 |
| GET | /api/tagger/players/:id/exports | 导出（csv/json） |

### 3. 状态模型（已冻结）
`pgn_uploads.status` 枚举：
- pending
- processing
- needs_confirmation
- done
- failed
- completed_with_errors

### 4. 文件结构约束
- 新建代码文件不超过 200 行
- 超过必须按语义拆分到新文件夹

## Checklist 完成状态
- [x] 确认后端分层不侵入 core
- [x] API 列表已冻结
- [x] 状态模型已冻结
- [x] 代码文件 200 行限制已写入规则

## 下一步
进入 Stage 03：R2 存储与元数据
