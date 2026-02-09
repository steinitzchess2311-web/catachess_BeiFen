# Blog API 端点说明

## 📖 文章查询接口

### 1. GET `/api/blogs/articles`
**用途：** 获取文章列表（主接口）

**逻辑：**
1. 接收查询参数：分类、搜索关键词、分页
2. 查询数据库，筛选已发布文章
3. 如果有 `category` 参数，按分类筛选
4. 如果有 `search` 参数，全文搜索标题+内容
5. 按发布时间倒序排序
6. 分页返回结果（默认每页 12 篇）

**返回：** 文章列表 + 分页信息

---

### 2. GET `/api/blogs/articles/pinned`
**用途：** 获取置顶文章

**逻辑：**
1. 查询 `is_pinned = true` 的文章
2. 按 `pin_order` 倒序排序（数字大的在前）
3. 最多返回 5 篇

**返回：** 置顶文章列表

---

### 3. GET `/api/blogs/articles/:id`
**用途：** 获取文章详情

**逻辑：**
1. 根据 `id` 查询文章
2. 检查文章是否存在且已发布
3. 自动增加浏览计数 `view_count + 1`
4. 返回完整文章内容（包括 HTML/Markdown）

**返回：** 完整文章数据

---

### 4. GET `/api/blogs/categories`
**用途：** 获取所有分类

**逻辑：**
1. 查询 `blog_categories` 表
2. 统计每个分类下的文章数量
3. 按 `order_index` 排序

**返回：** 分类列表 + 文章数量

---

### 5. GET `/api/blogs/search`
**用途：** 搜索文章

**逻辑：**
1. 接收搜索关键词 `q`
2. 使用 PostgreSQL 全文搜索：
   - 搜索字段：`title`, `subtitle`, `content`
   - 按相关度排序
3. 分页返回结果

**返回：** 搜索结果列表

---

## ✏️ 文章管理接口（管理员）

### 6. POST `/api/blogs/articles`
**用途：** 创建新文章

**权限：** 管理员/编辑

**逻辑：**
1. 验证用户权限（需要管理员）
2. 验证必填字段：`title`, `content`, `category`
3. 生成 UUID 作为文章 ID
4. 如果有封面图，上传到 Cloudflare R2
5. 插入数据库，状态默认为 `draft`
6. 如果 `status = 'published'`，设置 `published_at`

**返回：** 创建的文章信息

---

### 7. PUT `/api/blogs/articles/:id`
**用途：** 更新文章

**权限：** 管理员/编辑/文章作者

**逻辑：**
1. 验证用户权限
2. 根据 `id` 查找文章
3. 检查权限：管理员可编辑所有，作者只能编辑自己的
4. 更新字段，自动更新 `updated_at`
5. 如果状态从 `draft` 改为 `published`，设置 `published_at`

**返回：** 更新后的文章信息

---

### 8. DELETE `/api/blogs/articles/:id`
**用途：** 删除文章

**权限：** 管理员

**逻辑：**
1. 验证管理员权限
2. 根据 `id` 查找文章
3. 软删除（设置 `status = 'archived'`）或硬删除
4. 如果硬删除，同时删除封面图片和相关评论

**返回：** 删除成功确认

---

### 9. POST `/api/blogs/articles/:id/pin`
**用途：** 置顶/取消置顶文章

**权限：** 管理员

**逻辑：**
1. 验证管理员权限
2. 接收参数：`is_pinned` (true/false), `pin_order` (数字)
3. 更新文章的 `is_pinned` 和 `pin_order`
4. 如果置顶，自动排序：
   - 如果没指定 `pin_order`，取当前最大值 + 1
   - 其他置顶文章的顺序不变

**返回：** 更新后的文章信息

---

## 🖼️ 资源接口

### 10. POST `/api/blogs/upload-cover`
**用途：** 上传封面图片

**权限：** 管理员/编辑

**逻辑：**
1. 验证用户权限
2. 检查文件类型（jpg, png, webp）和大小（< 5MB）
3. 生成唯一文件名：`{year}/{month}/{uuid}.{ext}`
4. 上传到 Cloudflare R2
5. 生成缩略图（200x200, 400x400）
6. 返回图片 URL

**返回：** 图片 URL 列表（原图 + 缩略图）

---

## 📊 统计接口

### 11. GET `/api/blogs/stats`
**用途：** 获取博客统计数据

**权限：** 公开

**逻辑：**
1. 查询数据库，统计：
   - 总文章数
   - 各分类文章数
   - 总浏览量
   - 本周新增文章数
2. 从 Redis 缓存读取（1 小时过期）

**返回：** 统计数据对象

---

## 👥 用户博客接口（第二阶段）

### 12. POST `/api/blogs/user-articles`
**用途：** 用户发布博客

**权限：** 登录用户

**逻辑：**
1. 验证用户登录
2. 检查发布限制（10 篇/天）
3. 创建文章，`author_type = 'user'`, `status = 'pending'`
4. 进入审核队列，等待管理员审核

**返回：** 文章信息 + 审核状态

---

### 13. GET `/api/blogs/user-articles/my`
**用途：** 获取我的博客列表

**权限：** 登录用户

**逻辑：**
1. 验证用户登录
2. 查询当前用户的所有文章
3. 包括所有状态：`draft`, `pending`, `published`, `archived`
4. 按创建时间倒序

**返回：** 用户的文章列表

---

## 💬 互动接口（第三阶段）

### 14. POST `/api/blogs/articles/:id/like`
**用途：** 点赞文章

**权限：** 登录用户

**逻辑：**
1. 验证用户登录
2. 检查是否已点赞（`blog_likes` 表）
3. 如果未点赞：
   - 插入点赞记录
   - `like_count + 1`
4. 如果已点赞，返回提示

**返回：** 点赞成功 + 最新点赞数

---

### 15. DELETE `/api/blogs/articles/:id/like`
**用途：** 取消点赞

**权限：** 登录用户

**逻辑：**
1. 验证用户登录
2. 删除点赞记录
3. `like_count - 1`

**返回：** 取消成功 + 最新点赞数

---

### 16. POST `/api/blogs/articles/:id/comments`
**用途：** 发表评论

**权限：** 登录用户

**逻辑：**
1. 验证用户登录
2. 接收评论内容和父评论 ID（支持回复）
3. HTML 清洗（防止 XSS）
4. 插入 `blog_comments` 表
5. `comment_count + 1`
6. 如果是回复，通知被回复者

**返回：** 评论信息

---

### 17. GET `/api/blogs/articles/:id/comments`
**用途：** 获取文章评论列表

**权限：** 公开

**逻辑：**
1. 查询文章的所有评论
2. 构建评论树（父评论 → 子评论）
3. 按时间倒序排序
4. 分页返回（每页 20 条）

**返回：** 评论列表（树形结构）

---

## 🔍 数据流程示例

### 前端请求文章列表：
```
用户访问 BlogsPage
  ↓
前端调用: GET /api/blogs/articles?category=about&page=1
  ↓
后端逻辑:
  1. 查询 WHERE category='about' AND status='published'
  2. ORDER BY published_at DESC
  3. LIMIT 12 OFFSET 0
  ↓
返回: { articles: [...], pagination: {...} }
  ↓
前端渲染 ArticleModal 卡片
```

### 用户点击文章：
```
用户点击文章卡片
  ↓
前端调用: GET /api/blogs/articles/{id}
  ↓
后端逻辑:
  1. SELECT * FROM blog_articles WHERE id={id}
  2. UPDATE view_count = view_count + 1
  ↓
返回: { id, title, content, ... }
  ↓
前端渲染文章详情页
```

### 管理员置顶文章：
```
管理员点击置顶按钮
  ↓
前端调用: POST /api/blogs/articles/{id}/pin
  Body: { is_pinned: true, pin_order: 10 }
  ↓
后端逻辑:
  1. 验证管理员权限
  2. UPDATE is_pinned=true, pin_order=10
  ↓
返回: { success: true }
  ↓
前端刷新列表，文章出现在置顶区域
```

---

## 📝 备注

### 缓存策略：
- 文章列表：Redis 缓存 5 分钟
- 文章详情：Redis 缓存 10 分钟
- 分类列表：Redis 缓存 1 小时
- 统计数据：Redis 缓存 1 小时

### 速率限制：
- 文章查询：100 次/分钟/IP
- 文章创建：10 次/小时/用户
- 用户博客：10 篇/天/用户
- 评论发布：20 次/小时/用户

### 权限级别：
- `公开` - 任何人可访问
- `登录用户` - 需要有效 JWT token
- `编辑` - role = 'editor' 或 'admin'
- `管理员` - role = 'admin'

---

## 🚀 MVP 优先级

**第一阶段（1 周）：**
- ✅ 端点 1, 2, 3, 4（文章查询）
- ✅ 端点 6, 7, 8（文章管理）
- ✅ 端点 10（图片上传）

**第二阶段（1 周）：**
- ✅ 端点 5（搜索）
- ✅ 端点 9（置顶）
- ✅ 端点 11（统计）

**第三阶段（2 周）：**
- ✅ 端点 12, 13（用户博客）
- ✅ 端点 14, 15, 16, 17（互动功能）

---

**总计：** 17 个端点，分 3 个阶段实施
