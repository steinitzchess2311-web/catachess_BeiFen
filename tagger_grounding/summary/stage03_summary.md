# Stage 03 Summary - R2 存储方案

## 完成内容

### 1. Bucket 配置
| 项目 | 值 |
|------|------|
| Bucket 名称 | catachess-pgn |
| 权限 | 仅后端服务写入/读取 |

### 2. Key 规范
| 文件类型 | Key 格式 |
|----------|----------|
| PGN 原文 | players/{player_id}/{upload_id}/raw.pgn |
| 元数据 | players/{player_id}/{upload_id}/meta.json |

### 3. meta.json 内容
- checksum：文件校验和
- original_filename：原始文件名
- upload_user_id：上传用户 ID
- uploaded_at：上传时间
- parser_version：解析器版本

### 4. 重算与版本规则
- 不覆盖 raw.pgn
- 重算时写新的 upload_id 目录

## Checklist 完成状态
- [x] R2 bucket 名称与权限确认
- [x] Key 规范确认
- [x] meta.json 内容确认
- [x] 重算不覆盖规则确认

## 下一步
进入 Stage 04：Postgres 表结构与索引
