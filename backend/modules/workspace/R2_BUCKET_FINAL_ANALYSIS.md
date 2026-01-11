# R2 Bucket 需求最终分析报告

**日期**: 2026-01-11 16:00
**分析人**: 监工
**文档依据**: claude_plan.md + implement.md

---

## 老板的问题

1. ✅ 确认到底需要多少个 bucket？
2. ✅ Discussion 系统不需要 bucket 吗？（附件、图片等）

---

## 答案：需要 1 个 Bucket（当前设计）

### 根据 claude_plan.md 和 implement.md 的设计

**唯一的 bucket**: `workspace` （已授权 ✅）

### R2 存储结构（来自 claude_plan.md:740-751）

```
r2://workspace-storage/
├── raw/                           # 原始导入 PGN（可选保留）
│   └── {upload_id}.pgn
├── chapters/                      # 章节级 PGN（标准化后）
│   └── {chapter_id}.pgn
├── exports/                       # 导出产物
│   ├── {job_id}.pgn
│   └── {job_id}.zip
└── snapshots/                     # 版本快照
    └── {study_id}/
        └── {version}.json
```

**注意**: ❌ **没有 discussions/ 或 attachments/ 目录！**

---

## 各 Phase 对 R2 的使用情况

### Phase 0: 协议定义
- ✅ 定义 R2 key 命名规范（implement.md:29-33）
  - `raw/{upload_id}.pgn`
  - `chapters/{chapter_id}.pgn`
  - `exports/{job_id}.{pgn|zip}`
  - `snapshots/{study_id}/{version}.json`

### Phase 2: Study 导入与 Chapter 检测
- ✅ **使用 R2**
- 存储位置: `raw/` 和 `chapters/`
- 用途: 导入 PGN 文件，章节拆分
- 实现文件: `storage/r2_client.py`

### Phase 4: PGN Cleaner
- ✅ **使用 R2**
- 存储位置: `chapters/`
- 用途: 从 R2 读取 chapter PGN，裁剪后写回
- 引用: claude_plan.md:1341 "**R2**：写入 chapter pgn"

### Phase 5: 讨论系统 ⚠️
- ❌ **不使用 R2**
- 存储位置: **PostgreSQL 数据库**
  - `discussions` 表
  - `replies` 表
  - `reactions` 表
- 数据格式:
  - `content: str` - Markdown 格式（claude_plan.md:345, 361）
  - **没有附件字段！**
- 支持功能（claude_plan.md:371-377）:
  - ✅ Markdown 格式
  - ✅ 代码高亮（PGN/FEN 片段）
  - ✅ 棋盘位置引用（FEN snapshot）
  - ✅ 棋步引用（链接到具体 chapter + move）
  - ❌ **图片上传**
  - ❌ **文件附件**

### Phase 8: 版本历史与回滚
- ✅ **使用 R2**
- 存储位置: `snapshots/{study_id}/{version}.json`
- 用途: 版本快照存储
- 引用: claude_plan.md:1390 "**R2**：快照内容存储"
- 原因（claude_plan.md:1482-1488）:
  - Study 可能很大（64 chapters）
  - DB 存元数据，R2 存完整内容
  - 性能优化 + 成本优化

### Phase 9: 导出与打包
- ✅ **使用 R2**
- 存储位置: `exports/{job_id}.{pgn|zip}`
- 用途: 导出产物存储 + 预签名下载
- 引用: claude_plan.md:1397 "**R2** 写产物 + 预签名下载"

### Phase 6, 7, 10, 11, 12
- ❌ **不使用 R2**
- 全部存储在 PostgreSQL 或 Redis

---

## Discussion 系统的存储架构

### 当前设计（Phase 5）

**数据库表结构**（claude_plan.md:339-367）:

```python
class DiscussionThread:
    thread_id: str
    target_id: str
    target_type: NodeType
    author_id: str
    title: str
    content: str              # ← Markdown 文本（存 DB）
    thread_type: ThreadType
    pinned: bool
    resolved: bool
    created_at: datetime
    updated_at: datetime

class DiscussionReply:
    reply_id: str
    thread_id: str
    parent_reply_id: str | None
    author_id: str
    content: str              # ← Markdown 文本（存 DB）
    quote_reply_id: str | None
    edited: bool
    edit_history: list[EditRecord]
    created_at: datetime
    updated_at: datetime
```

**关键发现**:
- ✅ `content` 字段是 `str` 类型（Markdown）
- ❌ **没有** `attachments` 字段
- ❌ **没有** `images` 字段
- ❌ **没有** R2 key 引用

### 为什么 Discussion 不用 R2？

**设计哲学**（基于文档分析）:

1. **轻量级评论系统**
   - Discussion 是用户评论、问答、建议
   - 主要是文本内容（Markdown）
   - 不是文件分享或图片社区

2. **引用而非上传**
   - 支持引用棋步（链接到 chapter）
   - 支持引用棋盘位置（FEN snapshot）
   - 支持代码高亮（PGN/FEN 片段）
   - **但都是文本引用，不是文件上传**

3. **数据库优势**
   - 搜索方便（PostgreSQL 全文搜索）
   - 事务一致性（讨论 + 回复 + 通知原子操作）
   - 查询性能（索引、JOIN）

---

## 如果未来需要 Discussion 附件功能

### 需要扩展的地方

#### 1. R2 Key 规范扩展（storage/keys.py）

```python
# 新增 attachments 前缀
def discussion_attachment(thread_id: str, attachment_id: str, ext: str) -> str:
    return f"attachments/discussions/{thread_id}/{attachment_id}.{ext}"

def reply_attachment(reply_id: str, attachment_id: str, ext: str) -> str:
    return f"attachments/replies/{reply_id}/{attachment_id}.{ext}"
```

#### 2. 数据库表扩展

```python
# 新增 discussion_attachments 表
class DiscussionAttachment:
    attachment_id: str
    discussion_id: str  # thread_id or reply_id
    attachment_type: str  # "thread" or "reply"
    file_name: str
    file_size: int
    mime_type: str
    r2_key: str         # ← 指向 R2 对象
    uploaded_by: str
    uploaded_at: datetime
```

#### 3. R2 Bucket 结构扩展

```
workspace/
├── raw/
├── chapters/
├── exports/
├── snapshots/
└── attachments/                    # ← 新增
    ├── discussions/
    │   └── {thread_id}/
    │       └── {attachment_id}.{ext}
    └── replies/
        └── {reply_id}/
            └── {attachment_id}.{ext}
```

#### 4. API 扩展

```python
POST /discussions/{thread_id}/attachments  # 上传附件
GET  /discussions/{thread_id}/attachments  # 列出附件
DELETE /attachments/{attachment_id}        # 删除附件
GET  /attachments/{attachment_id}/download # 预签名下载
```

### 预估成本影响

**假设场景**:
- 1000 个 discussion threads
- 平均每个 5 张图片（假设 200KB/张）
- 总存储: 1000 × 5 × 200KB = 1GB

**Cloudflare R2 成本**:
- 存储: 1GB（在免费 10GB 内）✅
- 下载: 免费（R2 不收出站费用）✅
- API 调用: 上传 5000 次（在免费 1M 次内）✅

**结论**: 即使加上 discussion 附件，仍在免费额度内！

---

## 最终确认：需要几个 Bucket？

### 当前设计（Phase 0-12）

**答案**: **1 个 bucket** ✅

- Bucket 名称: `workspace`
- 用途: PGN 文件、导出产物、版本快照
- Discussion: **不需要 R2**（纯文本存 DB）

### 如果未来扩展 Discussion 附件

**答案**: 仍然 **1 个 bucket** ✅

**原因**:
1. 可以在同一 bucket 内用目录隔离（`attachments/`）
2. 统一权限管理（同一个 access key）
3. 成本优化（避免多 bucket 管理开销）
4. 架构简单（一个 R2Client 实例）

**不建议**创建独立 bucket（如 `workspace-attachments`）:
- ❌ 管理复杂（两个 access key）
- ❌ 成本增加（每个 bucket 都要配额管理）
- ❌ 代码复杂（两个 R2Client 实例）

---

## 监工建议

### 短期（当前 Phase 4-5 修复）

1. ✅ 继续使用唯一的 `workspace` bucket
2. ✅ Discussion 系统完全用 PostgreSQL（符合设计）
3. ⏸️ 不实现附件功能（文档没设计）

### 中期（Phase 6-9 实现）

1. ✅ Phase 8 版本快照用 R2（按设计）
2. ✅ Phase 9 导出产物用 R2（按设计）
3. ✅ 保持 1 个 bucket 架构

### 长期（如果需要附件功能）

**前置条件**:
1. ⚠️ 用户明确需求（真的需要上传图片/文件吗？）
2. ⚠️ 产品决策（是否符合产品定位？）
3. ⚠️ 安全评估（病毒扫描、内容审核、容量限制）

**技术方案**:
1. ✅ 在 `workspace` bucket 新增 `attachments/` 目录
2. ✅ 添加 `discussion_attachments` 数据库表
3. ✅ 实现上传 API + 预签名下载
4. ✅ 添加文件类型白名单（png, jpg, pgn 等）
5. ✅ 添加大小限制（建议单文件 < 5MB）

---

## 与其他 Backend 模块对比

### backend/storage/ 模块（玩家对局历史）

**设计用途**:
- 玩家下的棋局 PGN
- 引擎分析结果

**Bucket 需求**: `catachess-data`（或其他名称）

**状态**: ⏸️ 未启用（老板未授权）

**是否需要**: 取决于产品规划
- 如果有"玩家对局功能" → 需要独立 bucket
- 如果只做"学习平台" → 不需要

### backend/modules/workspace/ 模块（学习工作空间）

**设计用途**:
- Study 管理
- PGN 导入编辑
- 讨论系统
- 版本历史

**Bucket 需求**: `workspace` ✅（已授权）

**状态**: ✅ 正在使用

---

## 结论

### 回答老板的问题

**1. 到底需要多少个 bucket？**

**答**: **1 个** (`workspace`)

- ✅ 当前设计只需要 1 个
- ✅ 未来扩展 discussion 附件也只需要 1 个
- ❌ backend/storage 模块未启用，不算在内

**2. Discussion 系统不需要 bucket 吗？**

**答**: **不需要**（根据当前设计）

- ✅ Discussion 内容全部存 PostgreSQL
- ✅ 只支持 Markdown 文本
- ❌ 当前设计**没有附件功能**
- ⚠️ 如果未来需要附件，可以在同一个 `workspace` bucket 扩展

### 文档依据总结

| 问题 | 答案 | 文档依据 |
|------|------|---------|
| 需要几个 bucket？ | 1 个 | claude_plan.md:740-751 定义了 workspace-storage 结构 |
| Discussion 用 R2？ | 不用 | claude_plan.md:339-367 只定义了 content:str 字段 |
| 附件在哪？ | 没有 | implement.md:385-479 Phase 5 没有附件相关 checklist |
| 版本快照用 R2？ | 用 | claude_plan.md:1390, 1482-1488 |
| 导出产物用 R2？ | 用 | claude_plan.md:1397 |

---

## Railway 配置确认

### 需要在 Railway 添加的环境变量

```bash
R2_ENDPOINT=https://5f5a0298fe2da24a34b1fd0d3f795807.r2.cloudflarestorage.com
R2_ACCESS_KEY=2e32a213937e6b75316c0d4ea8f4a6e1
R2_SECRET_KEY=81b411967073f620788ad66c5118165b3f48f3363d88a558f0822cf0bc551f05
R2_BUCKET=workspace
```

✅ 这就是全部需要的配置！

---

**监工签字**: ✅
**分析时间**: 2026-01-11 16:00
**文档版本**: claude_plan.md + implement.md (最新版本)
**结论**: 1 个 bucket 足够，Discussion 无附件功能
