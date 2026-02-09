# Blog API 接口文档

## 📋 API 端点总览

### 公开接口（无需认证）

| 方法 | 端点 | 功能 | 缓存 | 状态 |
|------|------|------|------|------|
| GET | `/api/blogs/categories` | 获取分类列表 | 1小时 | ✅ 已实现 |
| GET | `/api/blogs/articles` | 获取文章列表（分页+搜索+筛选） | 5分钟 | ✅ 已实现 |
| GET | `/api/blogs/articles/pinned` | 获取置顶文章 | 5分钟 | ✅ 已实现 |
| GET | `/api/blogs/articles/{id}` | 获取文章详情 | 10分钟 | ✅ 已实现 |
| GET | `/api/blogs/cache/stats` | 查看缓存统计 | - | ✅ 已实现 |

### 管理接口（需要认证）

| 方法 | 端点 | 功能 | 权限要求 | 状态 |
|------|------|------|---------|------|
| GET | `/api/blogs/articles/my-drafts` | 获取我的草稿 | Editor/Admin | ✅ 已实现 |
| POST | `/api/blogs/upload-image` | 上传图片到R2 | Editor/Admin | ✅ 已实现 |
| POST | `/api/blogs/articles` | 创建文章 | Editor/Admin | ✅ 已实现 |
| PUT | `/api/blogs/articles/{id}` | 更新文章 | 作者/Admin | ✅ 已实现 |
| DELETE | `/api/blogs/articles/{id}` | 删除文章 | 作者/Admin | ✅ 已实现 |
| POST | `/api/blogs/articles/{id}/pin` | 置顶/取消置顶 | Admin | ✅ 已实现 |

---

## 📖 公开接口详解

### 1. 获取分类列表
```
GET /api/blogs/categories
```

**功能：** 返回所有活跃分类及其元数据

**参数：** 无

**返回示例：**
```json
[
  {
    "id": "uuid",
    "name": "about",
    "display_name": "About Us",
    "description": "Learn about Chessortag platform",
    "icon": "📖",
    "order_index": 1,
    "is_active": true,
    "created_at": "2026-02-09T19:58:46.490453"
  }
]
```

**缓存策略：** Redis 1小时

---

### 2. 获取文章列表
```
GET /api/blogs/articles
```

**功能：** 分页获取已发布文章，支持分类筛选和全文搜索

**查询参数：**
- `category` (可选): 分类筛选 (about/function/allblogs/user)
- `search` (可选): 全文搜索关键词（搜索标题+内容）
- `page` (默认1): 页码，从1开始
- `page_size` (默认10): 每页数量，最大50

**排序规则：**
1. 置顶文章优先（is_pinned=true）
2. 按pin_order倒序（置顶文章之间）
3. 按published_at倒序（发布时间）

**返回示例：**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "文章标题",
      "subtitle": "副标题",
      "cover_image_url": "https://cdn.example.com/image.jpg",
      "author_name": "作者名",
      "author_type": "human",
      "category": "function",
      "tags": ["教程", "新手"],
      "is_pinned": false,
      "view_count": 1234,
      "like_count": 56,
      "comment_count": 12,
      "created_at": "2026-02-09T10:00:00Z",
      "published_at": "2026-02-09T10:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "page_size": 10,
  "total_pages": 3,
  "has_next": true,
  "has_prev": false
}
```

**缓存策略：**
- 有search参数：不缓存（实时查询）
- 无search参数：Redis 5分钟

**示例请求：**
```bash
# 获取所有文章，第1页
GET /api/blogs/articles?page=1&page_size=10

# 按分类筛选
GET /api/blogs/articles?category=function&page=1

# 搜索文章
GET /api/blogs/articles?search=国际象棋&page=1
```

---

### 3. 获取置顶文章
```
GET /api/blogs/articles/pinned
```

**功能：** 返回所有置顶文章

**参数：** 无

**排序规则：**
1. 按pin_order倒序（数字大的在前）
2. 按published_at倒序

**返回：** 文章列表（格式同上，不含content字段）

**缓存策略：** Redis 5分钟

---

### 4. 获取文章详情
```
GET /api/blogs/articles/{id}
```

**功能：** 获取单篇文章的完整内容

**路径参数：**
- `id`: 文章UUID

**副作用：**
- 自动增加浏览计数（view_count + 1）
- 浏览计数异步更新，不影响响应速度

**返回示例：**
```json
{
  "id": "uuid",
  "title": "文章标题",
  "subtitle": "副标题",
  "content": "# Markdown内容\n\n这是文章正文...",
  "cover_image_url": "https://cdn.example.com/cover.jpg",
  "author_id": "uuid",
  "author_name": "作者名",
  "author_type": "human",
  "category": "function",
  "sub_category": "tutorial",
  "tags": ["教程", "新手"],
  "status": "published",
  "is_pinned": false,
  "pin_order": 0,
  "view_count": 1235,
  "like_count": 56,
  "comment_count": 12,
  "created_at": "2026-02-09T10:00:00Z",
  "updated_at": "2026-02-09T11:00:00Z",
  "published_at": "2026-02-09T10:00:00Z"
}
```

**错误响应：**
- 404: 文章不存在或未发布

**缓存策略：** Redis 10分钟

---

### 5. 查看缓存统计（调试用）
```
GET /api/blogs/cache/stats
```

**功能：** 查看Redis缓存命中率和统计信息

**返回示例：**
```json
{
  "connected": true,
  "hit_rate": 54.55,
  "total_hits": 120,
  "total_misses": 100,
  "keys_count": 25
}
```

---

## ✏️ 管理接口详解

### 6. 获取我的草稿
```
GET /api/blogs/articles/my-drafts
```

**功能：** 获取当前用户的所有草稿文章

**认证：** 需要Editor或Admin角色

**权限：** 只能查看自己创建的草稿

**排序：** 按updated_at倒序（最近编辑的在前）

**返回：** 文章列表（格式同"获取文章列表"，不含content字段）

**缓存策略：** 不缓存（实时查询）

---

### 7. 上传图片
```
POST /api/blogs/upload-image
```

**功能：** 上传图片到Cloudflare R2存储

**认证：** 需要Editor或Admin角色

**请求格式：** multipart/form-data

**参数：**
- `file` (必需): 图片文件，最大5MB
- `resize_mode` (默认adaptive_width): 处理模式
  - `original`: 保持原始尺寸，轻度压缩（90%质量）
  - `adaptive_width`: 自适应宽度，最大1920px，WebP格式（85%质量）
- `image_type` (默认content): 图片类型
  - `cover`: 封面图
  - `content`: 内容图

**支持格式：** JPEG, PNG, GIF, WEBP

**处理逻辑：**
1. 验证文件大小和格式
2. 根据resize_mode处理图片
3. 上传到R2存储（路径：`blog/年/月/唯一ID_文件名`）
4. 保存元数据到PostgreSQL（blog_images表）

**返回示例：**
```json
{
  "id": "uuid",
  "url": "https://cdn.example.com/blog/2026/02/abc123_image.webp",
  "filename": "image.webp",
  "size_bytes": 245678,
  "width": 1920,
  "height": 1080,
  "resize_mode": "adaptive_width",
  "image_type": "content"
}
```

**错误响应：**
- 400: 文件大小超限或格式不支持
- 500: 上传失败

---

### 8. 创建文章
```
POST /api/blogs/articles
```

**功能：** 创建新文章（草稿或直接发布）

**认证：** 需要Editor或Admin角色

**请求体示例：**
```json
{
  "title": "文章标题",
  "subtitle": "副标题（可选）",
  "content": "# Markdown内容\n\n文章正文...",
  "cover_image_url": "https://cdn.example.com/cover.jpg",
  "author_name": "作者名",
  "author_type": "human",
  "category": "function",
  "sub_category": "tutorial",
  "tags": ["教程", "新手"],
  "status": "draft",
  "is_pinned": false,
  "pin_order": 0
}
```

**字段说明：**
- `title` (必需): 标题
- `content` (必需): Markdown格式内容
- `category` (必需): 分类名（about/function/allblogs/user）
- `status` (默认draft): 状态
  - `draft`: 草稿（不公开）
  - `published`: 发布（公开）
  - `archived`: 归档（不公开）
- `author_type`: human（人类）或 ai（AI生成）
- 其他字段可选

**自动处理：**
- 自动设置author_id为当前用户
- status=published时，自动设置published_at
- 初始化计数器（view_count、like_count等）为0

**返回：** 完整文章对象

**缓存失效：** 自动清除相关分类和总列表缓存

---

### 9. 更新文章
```
PUT /api/blogs/articles/{id}
```

**功能：** 更新现有文章

**认证：** 需要Editor或Admin角色

**权限检查：**
- ✅ 用户可以编辑**自己的**文章
- ✅ Admin可以编辑**任何**文章
- ❌ 用户不能编辑他人的文章

**路径参数：**
- `id`: 文章UUID

**请求体：** 部分更新（只需提供要修改的字段）
```json
{
  "title": "新标题",
  "content": "更新后的内容",
  "status": "published"
}
```

**自动处理：**
- 自动更新updated_at时间戳
- status从draft改为published时，自动设置published_at

**返回：** 更新后的完整文章对象

**错误响应：**
- 403: 权限不足（不能编辑他人文章）
- 404: 文章不存在

**缓存失效：** 自动清除文章详情、相关分类和总列表缓存

---

### 10. 删除文章
```
DELETE /api/blogs/articles/{id}
```

**功能：** 删除文章（硬删除）

**认证：** 需要Editor或Admin角色

**权限检查：**
- ✅ 用户可以删除**自己的**文章
- ✅ Admin可以删除**任何**文章
- ❌ 用户不能删除他人的文章

**路径参数：**
- `id`: 文章UUID

**删除行为：**
- 硬删除（从数据库中永久删除）
- 相关图片的article_id设置为NULL（图片不删除）

**返回示例：**
```json
{
  "success": true,
  "message": "Article deleted successfully"
}
```

**错误响应：**
- 403: 权限不足（不能删除他人文章）
- 404: 文章不存在

**缓存失效：** 自动清除文章详情、相关分类和总列表缓存

---

### 11. 置顶/取消置顶文章
```
POST /api/blogs/articles/{id}/pin
```

**功能：** 设置文章置顶优先级

**认证：** 需要Admin角色（仅管理员可操作）

**路径参数：**
- `id`: 文章UUID

**查询参数：**
- `pin_order` (默认0): 置顶优先级
  - 0: 取消置顶
  - >0: 设置置顶，数字越大优先级越高

**示例：**
```bash
# 置顶文章，优先级10
POST /api/blogs/articles/{id}/pin?pin_order=10

# 取消置顶
POST /api/blogs/articles/{id}/pin?pin_order=0
```

**返回示例：**
```json
{
  "success": true,
  "message": "Article pinned with order 10",
  "is_pinned": true,
  "pin_order": 10
}
```

**错误响应：**
- 403: 权限不足（需要Admin角色）
- 404: 文章不存在

**缓存失效：** 自动清除文章详情、相关分类、总列表和置顶列表缓存

---

## 🔐 认证与权限

### 认证方式
```
Authorization: Bearer <JWT_TOKEN>
```

### 权限级别

| 角色 | 权限说明 |
|------|---------|
| **游客（未登录）** | 查看已发布文章、分类 |
| **Editor（编辑）** | 创建/编辑/删除**自己的**文章、上传图片、查看自己的草稿 |
| **Admin（管理员）** | 所有Editor权限 + 编辑/删除**任何**文章 + 置顶文章 |

### 开发模式
设置环境变量 `BLOG_DEV_MODE=true` 可绕过认证（仅用于开发测试）

---

## 💾 数据库与缓存

### 数据表

| 表名 | 用途 |
|------|------|
| `blog_articles` | 文章主表 |
| `blog_categories` | 分类表 |
| `blog_images` | 图片元数据 |

### 缓存策略

| 数据类型 | TTL | 键格式 |
|---------|-----|--------|
| 分类列表 | 1小时 | `blog:categories` |
| 文章列表 | 5分钟 | `blog:articles:{category}:{page}` |
| 置顶文章 | 5分钟 | `blog:pinned` |
| 文章详情 | 10分钟 | `blog:article:{id}` |
| 浏览计数 | 实时 | `blog:views:{id}` |

### 缓存失效规则

| 操作 | 失效范围 |
|------|---------|
| 创建文章 | 相关分类列表、总列表、分类统计 |
| 更新文章 | 文章详情、相关分类列表、总列表 |
| 删除文章 | 文章详情、相关分类列表、总列表 |
| 置顶文章 | 文章详情、相关分类列表、总列表、置顶列表 |

---

## 🚀 草稿管理工作流

### 完整流程示例

```bash
# 1. 创建草稿
POST /api/blogs/articles
{
  "title": "我的新文章",
  "content": "草稿内容...",
  "status": "draft",
  "category": "function"
}
# 返回: { "id": "article-uuid", ... }

# 2. 查看我的草稿列表
GET /api/blogs/articles/my-drafts
# 返回: [{ "id": "article-uuid", "title": "我的新文章", ... }]

# 3. 编辑草稿
PUT /api/blogs/articles/{article-uuid}
{
  "title": "更新后的标题",
  "content": "更新后的内容"
}

# 4. 发布草稿
PUT /api/blogs/articles/{article-uuid}
{
  "status": "published"
}

# 5. （可选）删除文章
DELETE /api/blogs/articles/{article-uuid}
```

### 前端集成建议

**混合存储策略：**
1. **localStorage自动保存**：每30秒保存到浏览器本地（防意外关闭）
2. **手动保存到服务器**：用户点击"保存草稿"按钮时保存到数据库
3. **冲突检测**：页面加载时，比较localStorage和服务器时间戳，提示用户选择

详细前端集成代码请参考：`DRAFT_API.md`

---

## 📊 性能指标

### 响应时间（90th percentile）

| 端点类型 | 缓存命中 | 缓存未命中 |
|---------|---------|-----------|
| 文章列表 | <50ms | <200ms |
| 文章详情 | <30ms | <150ms |
| 分类列表 | <20ms | <100ms |
| 图片上传 | - | <2000ms |

### 容量规划

- **并发请求**：支持1000+ QPS（4 worker进程）
- **数据库连接池**：60连接（每worker 15连接）
- **Redis连接**：每worker 1个异步连接
- **文件上传**：最大5MB/请求

---

## 🔄 错误码说明

| 状态码 | 说明 | 常见原因 |
|--------|------|---------|
| 200 | 成功 | - |
| 400 | 请求错误 | 参数验证失败、文件格式不支持 |
| 401 | 未认证 | 缺少Authorization头或token无效 |
| 403 | 权限不足 | 尝试编辑他人文章、非Admin尝试置顶 |
| 404 | 资源不存在 | 文章不存在或未发布 |
| 422 | 参数验证失败 | 字段类型错误、UUID格式错误 |
| 500 | 服务器错误 | 数据库连接失败、R2上传失败 |

---

## 📝 状态字段说明

### article.status

| 值 | 说明 | 公开可见 |
|----|------|---------|
| `draft` | 草稿 | ❌ 仅作者和Admin可见 |
| `published` | 已发布 | ✅ 所有人可见 |
| `archived` | 已归档 | ❌ 仅作者和Admin可见 |

### article.author_type

| 值 | 说明 |
|----|------|
| `human` | 人类作者 |
| `ai` | AI生成内容 |

---

## 🎯 MVP实施状态

### ✅ 第一阶段（已完成）
- [x] 数据库表设计与迁移
- [x] Redis缓存服务
- [x] 文章查询接口（列表、详情、分类）
- [x] 图片上传到R2
- [x] 文章管理接口（创建、编辑、删除）

### ✅ 第二阶段（已完成）
- [x] 置顶文章功能
- [x] 全文搜索（title + content ILIKE）
- [x] 草稿管理系统
- [x] 作者权限控制

### 🔜 第三阶段（规划中）
- [ ] 用户发布博客
- [ ] 点赞功能
- [ ] 评论系统
- [ ] PostgreSQL全文搜索（GIN索引）

---

**Base URL:** `https://api.catachess.com`

**文档版本:** v1.0.0

**最后更新:** 2026-02-09
