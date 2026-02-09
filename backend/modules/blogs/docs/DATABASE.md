# Blog 数据库设计

## 🎯 核心需求

### 需要储存什么？
1. **文章内容** - 标题、正文、封面图、作者、分类
2. **分类信息** - 官方博客分类（About Us, Function Intro, All Blogs）
3. **用户互动** - 评论、点赞、浏览记录
4. **统计数据** - 浏览量、点赞数、评论数

---

## 📊 数据库表设计

### **第一阶段（MVP 必需）：2 张表**

---

## 表 1: `blog_articles` - 文章主表 ⭐️

**用途：** 储存所有博客文章

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| **id** | UUID | 主键，唯一标识 | `550e8400-e29b-41d4-a716-446655440000` |
| **title** | VARCHAR(200) | 文章标题 | `"Welcome to Chessortag"` |
| **subtitle** | TEXT | 副标题/摘要 | `"Discover the power of chess analysis"` |
| **content** | TEXT | 正文内容（HTML/Markdown） | `"<h1>Introduction</h1><p>..."` |
| **cover_image_url** | TEXT | 封面图片 URL | `"https://cdn.catachess.com/covers/abc.jpg"` |
| | | | |
| **author_id** | UUID | 作者 ID（外键→users表） | `550e8400-...`（官方文章为 NULL） |
| **author_name** | VARCHAR(100) | 作者显示名称 | `"Chessortag Team"` |
| **author_type** | VARCHAR(20) | 作者类型 | `"official"` 或 `"user"` |
| | | | |
| **category** | VARCHAR(50) | 主分类 | `"about"`, `"function"`, `"allblogs"` |
| **sub_category** | VARCHAR(50) | 子分类（可选） | `"About Us"`, `"Tutorial"` |
| **tags** | TEXT[] | 标签数组 | `["tutorial", "beginner"]` |
| | | | |
| **status** | VARCHAR(20) | 文章状态 | `"draft"`, `"published"`, `"archived"` |
| **is_pinned** | BOOLEAN | 是否置顶 | `true` / `false` |
| **pin_order** | INTEGER | 置顶排序（数字越大越靠前） | `10`, `5`, `0` |
| | | | |
| **view_count** | INTEGER | 浏览次数 | `1234` |
| **like_count** | INTEGER | 点赞数 | `56` |
| **comment_count** | INTEGER | 评论数 | `12` |
| | | | |
| **created_at** | TIMESTAMP | 创建时间 | `2024-02-01 10:00:00` |
| **updated_at** | TIMESTAMP | 最后更新时间 | `2024-02-08 15:30:00` |
| **published_at** | TIMESTAMP | 发布时间 | `2024-02-01 10:00:00` |

### 索引设计
```sql
-- 主键索引（自动）
PRIMARY KEY (id)

-- 查询优化索引
CREATE INDEX idx_status ON blog_articles(status);
CREATE INDEX idx_category ON blog_articles(category);
CREATE INDEX idx_pinned ON blog_articles(is_pinned, pin_order DESC);
CREATE INDEX idx_published_at ON blog_articles(published_at DESC);
CREATE INDEX idx_author ON blog_articles(author_id);

-- 全文搜索索引（PostgreSQL）
CREATE INDEX idx_search ON blog_articles
  USING gin(to_tsvector('english', title || ' ' || subtitle || ' ' || content));
```

### 示例数据
```sql
INSERT INTO blog_articles VALUES (
  gen_random_uuid(),                              -- id
  'Welcome to Chessortag',                        -- title
  'Discover the power of chess analysis',        -- subtitle
  '<h1>Introduction</h1><p>Welcome...</p>',       -- content
  'https://cdn.catachess.com/covers/welcome.jpg', -- cover_image_url
  NULL,                                           -- author_id (官方文章)
  'Chessortag Team',                              -- author_name
  'official',                                     -- author_type
  'about',                                        -- category
  'About Us',                                     -- sub_category
  ARRAY['introduction', 'features'],              -- tags
  'published',                                    -- status
  true,                                           -- is_pinned
  10,                                             -- pin_order
  1234,                                           -- view_count
  56,                                             -- like_count
  12,                                             -- comment_count
  NOW(),                                          -- created_at
  NOW(),                                          -- updated_at
  NOW()                                           -- published_at
);
```

---

## 表 2: `blog_categories` - 分类表

**用途：** 储存博客分类配置

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| **id** | UUID | 主键 | `650e8400-...` |
| **name** | VARCHAR(50) | 分类英文名（唯一） | `"about"`, `"function"` |
| **display_name** | VARCHAR(100) | 分类显示名称 | `"About Us"`, `"Function Intro"` |
| **description** | TEXT | 分类描述 | `"Learn about Chessortag platform"` |
| **icon** | VARCHAR(50) | 图标（emoji或图标名） | `"📖"`, `"⚙️"` |
| **order_index** | INTEGER | 显示排序 | `1`, `2`, `3` |
| **is_active** | BOOLEAN | 是否启用 | `true` / `false` |
| **created_at** | TIMESTAMP | 创建时间 | `2024-02-01 10:00:00` |

### 索引设计
```sql
PRIMARY KEY (id)
UNIQUE (name)  -- 分类名称唯一
CREATE INDEX idx_order ON blog_categories(order_index);
```

### 示例数据（对应前端分类）
```sql
INSERT INTO blog_categories VALUES
  (gen_random_uuid(), 'about', 'About Us', 'Learn about Chessortag', '📖', 1, true, NOW()),
  (gen_random_uuid(), 'function', 'Function Intro', 'Platform features', '⚙️', 2, true, NOW()),
  (gen_random_uuid(), 'allblogs', 'All Blogs', 'Browse all articles', '📚', 3, true, NOW()),
  (gen_random_uuid(), 'user', 'Users'' Blogs', 'Community articles', '✍️', 4, true, NOW());
```

---

## 📈 **第二阶段（扩展功能）：3 张表**

---

## 表 3: `blog_comments` - 评论表

**用途：** 储存文章评论和回复

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| **id** | UUID | 主键 | `750e8400-...` |
| **article_id** | UUID | 文章 ID（外键） | `550e8400-...` |
| **user_id** | UUID | 评论用户 ID（外键） | `850e8400-...` |
| **content** | TEXT | 评论内容 | `"Great article!"` |
| **parent_id** | UUID | 父评论 ID（支持回复） | `750e8400-...`（NULL = 顶层评论） |
| **is_deleted** | BOOLEAN | 是否已删除 | `false` |
| **created_at** | TIMESTAMP | 评论时间 | `2024-02-08 10:00:00` |

### 外键关系
```sql
FOREIGN KEY (article_id) REFERENCES blog_articles(id) ON DELETE CASCADE
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE SET NULL
```

### 索引设计
```sql
PRIMARY KEY (id)
CREATE INDEX idx_article ON blog_comments(article_id, created_at DESC);
CREATE INDEX idx_user ON blog_comments(user_id);
CREATE INDEX idx_parent ON blog_comments(parent_id);
```

### 示例：评论树结构
```
文章 ID: 550e8400-...
  ├─ 评论 1 (parent_id = NULL)
  │   ├─ 回复 1-1 (parent_id = 评论1的ID)
  │   └─ 回复 1-2 (parent_id = 评论1的ID)
  └─ 评论 2 (parent_id = NULL)
      └─ 回复 2-1 (parent_id = 评论2的ID)
```

---

## 表 4: `blog_likes` - 点赞表

**用途：** 储存用户点赞记录（防止重复点赞）

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| **id** | UUID | 主键 | `950e8400-...` |
| **article_id** | UUID | 文章 ID（外键） | `550e8400-...` |
| **user_id** | UUID | 点赞用户 ID（外键） | `850e8400-...` |
| **created_at** | TIMESTAMP | 点赞时间 | `2024-02-08 10:00:00` |

### 外键关系
```sql
FOREIGN KEY (article_id) REFERENCES blog_articles(id) ON DELETE CASCADE
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
UNIQUE (article_id, user_id)  -- 一个用户只能给一篇文章点赞一次
```

### 索引设计
```sql
PRIMARY KEY (id)
CREATE UNIQUE INDEX idx_unique_like ON blog_likes(article_id, user_id);
CREATE INDEX idx_article ON blog_likes(article_id);
CREATE INDEX idx_user ON blog_likes(user_id);
```

---

## 表 5: `blog_tags` - 标签表（可选）

**用途：** 独立管理标签（如果标签很多，建议独立表）

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| **id** | UUID | 主键 | `a50e8400-...` |
| **name** | VARCHAR(50) | 标签名称 | `"tutorial"`, `"beginner"` |
| **slug** | VARCHAR(50) | URL 友好名称 | `"tutorial"`, `"beginner"` |
| **usage_count** | INTEGER | 使用次数 | `25` |
| **created_at** | TIMESTAMP | 创建时间 | `2024-02-01 10:00:00` |

**注：** MVP 阶段可以不用独立标签表，直接在 `blog_articles.tags` 使用数组即可。

---

## 🔗 表关系图

```
users (现有表)
  │
  ├─→ blog_articles.author_id (一对多)
  │     │
  │     ├─→ blog_comments.article_id (一对多)
  │     └─→ blog_likes.article_id (一对多)
  │
  ├─→ blog_comments.user_id (一对多)
  └─→ blog_likes.user_id (一对多)

blog_categories
  └─→ blog_articles.category (通过 name 字段关联)

blog_comments.parent_id
  └─→ blog_comments.id (自引用，支持评论回复)
```

---

## 📝 数据存储需求总结

### **MVP 阶段（必需）：**

#### **表 1: blog_articles**
储存：
- ✅ 文章基本信息（标题、内容、封面）
- ✅ 作者信息（ID、名称、类型）
- ✅ 分类和标签
- ✅ 状态管理（草稿、已发布、已归档）
- ✅ 置顶控制
- ✅ 统计数据（浏览、点赞、评论数）
- ✅ 时间戳（创建、更新、发布）

#### **表 2: blog_categories**
储存：
- ✅ 分类配置（名称、描述、图标）
- ✅ 显示排序

**数据量预估：**
- 文章：100-1000 篇
- 分类：4-10 个
- **总计：2 张表，约 1000 条记录**

---

### **第二阶段（扩展）：**

#### **表 3: blog_comments**
储存：
- ✅ 评论内容和作者
- ✅ 评论层级关系（支持回复）
- ✅ 删除状态

#### **表 4: blog_likes**
储存：
- ✅ 点赞记录（用户 + 文章）
- ✅ 防重复点赞（UNIQUE 约束）

**数据量预估：**
- 评论：1000-10000 条
- 点赞：5000-50000 条
- **总计：5 张表，约 60000 条记录**

---

## 🎯 SQL 创建脚本（MVP）

```sql
-- 创建文章表
CREATE TABLE blog_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 基本信息
    title VARCHAR(200) NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL,
    cover_image_url TEXT,

    -- 作者信息
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) DEFAULT 'Chessortag Team',
    author_type VARCHAR(20) DEFAULT 'official',

    -- 分类和标签
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    tags TEXT[],

    -- 状态控制
    status VARCHAR(20) DEFAULT 'draft',
    is_pinned BOOLEAN DEFAULT FALSE,
    pin_order INTEGER DEFAULT 0,

    -- 统计
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,

    -- 时间戳
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP,

    -- 约束
    CHECK (status IN ('draft', 'published', 'archived')),
    CHECK (author_type IN ('official', 'user'))
);

-- 创建分类表
CREATE TABLE blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_articles_status ON blog_articles(status);
CREATE INDEX idx_articles_category ON blog_articles(category);
CREATE INDEX idx_articles_pinned ON blog_articles(is_pinned, pin_order DESC);
CREATE INDEX idx_articles_published_at ON blog_articles(published_at DESC);
CREATE INDEX idx_articles_author ON blog_articles(author_id);
CREATE INDEX idx_articles_search ON blog_articles
  USING gin(to_tsvector('english', title || ' ' || subtitle || ' ' || content));

CREATE INDEX idx_categories_order ON blog_categories(order_index);

-- 插入初始分类数据
INSERT INTO blog_categories (name, display_name, description, icon, order_index) VALUES
  ('about', 'About Us', 'Learn about Chessortag platform', '📖', 1),
  ('function', 'Function Intro', 'Platform features and tutorials', '⚙️', 2),
  ('allblogs', 'All Blogs', 'Browse all articles', '📚', 3),
  ('user', 'Users'' Blogs', 'Community articles', '✍️', 4);
```

---

## 💾 存储空间估算

### **单篇文章平均大小：**
- 标题：50 字节
- 副标题：200 字节
- 内容（HTML）：10-50 KB
- 其他字段：500 字节
- **平均：~20 KB/篇**

### **1000 篇文章：**
- 文章表：~20 MB
- 分类表：< 1 KB
- 索引：~5 MB
- **总计：~25 MB**

### **封面图片（单独存储在 Cloudflare R2）：**
- 原图：500 KB/张
- 缩略图：50 KB/张
- **1000 篇：~550 MB**

---

## 🔒 数据备份策略

1. **每日自动备份** - 凌晨 2:00
2. **保留周期** - 30 天
3. **备份内容**：
   - 所有表数据
   - 索引配置
   - 外键关系

---

## 📊 总结

### **MVP 需要 2 张表：**
1. ✅ **blog_articles** - 文章主表（核心）
2. ✅ **blog_categories** - 分类表（辅助）

### **未来扩展 3 张表：**
3. ⏳ **blog_comments** - 评论表
4. ⏳ **blog_likes** - 点赞表
5. ⏳ **blog_tags** - 标签表（可选）

### **储存内容：**
- 文章完整信息（标题、正文、封面、作者）
- 分类和标签
- 状态管理（发布、置顶）
- 统计数据（浏览、点赞、评论）
- 时间戳（创建、更新、发布）

### **数据量：**
- 初期：~1000 篇文章
- 数据库：~25 MB
- 图片：~550 MB（存储在 R2）

---

**先从 2 张表开始，够用吗？** 🚀
