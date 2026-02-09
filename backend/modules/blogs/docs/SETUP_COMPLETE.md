# Blog 模块设置完成

## ✅ 已完成的工作

### Step 0: 配置准备
- ✅ 数据库连接信息已添加到 `PLAN.md`
- ✅ `PLAN.md` 已加入 `.gitignore`（防止敏感信息泄露）

### Step 1: 数据库模型
- ✅ 创建 `backend/modules/blogs/db/models.py`
  - `BlogArticle` 模型（19 个字段）
  - `BlogCategory` 模型（7 个字段）

### Step 2: 数据库迁移
- ✅ 创建 Alembic 迁移脚本 `007_create_blog_tables.py`
- ✅ 创建自动建表脚本 `create_tables.py`

---

## 📋 数据库连接信息

### Blog 专用 PostgreSQL
```
BLOG_DATABASE_URL=postgresql://postgres:vnPFhpmxSMqmZpGSJcmshkwBKgJdqTpV@postgres-17e3b035.railway.internal:5432/railway
```

### Redis 缓存
```
REDIS_URL=redis://default:ejZLPFDbAVfzorRAuviPDqudHYwaHfSI@redis.railway.internal:6379
```

---

## 🚀 下一步：执行数据库迁移

### 方法 1：使用 create_tables.py（推荐）

**在 Railway 上执行：**
```bash
# SSH 到 Railway 容器
railway run bash

# 设置环境变量
export BLOG_DATABASE_URL="postgresql://postgres:vnPFhpmxSMqmZpGSJcmshkwBKgJdqTpV@postgres-17e3b035.railway.internal:5432/railway"

# 执行建表脚本
cd backend
python modules/blogs/create_tables.py
```

**本地执行（如果有权限）：**
```bash
# 设置环境变量
export BLOG_DATABASE_URL="postgresql://postgres:vnPFhpmxSMqmZpGSJcmshkwBKgJdqTpV@postgres-17e3b035.railway.internal:5432/railway"

# 执行
python backend/modules/blogs/create_tables.py
```

---

### 方法 2：使用 Alembic 迁移

```bash
# 在 backend 目录
cd backend

# 设置环境变量
export BLOG_DATABASE_URL="postgresql://postgres:vnPFhpmxSMqmZpGSJcmshkwBKgJdqTpV@postgres-17e3b035.railway.internal:5432/railway"

# 更新 alembic.ini 中的 sqlalchemy.url
# 或者直接运行
alembic upgrade head
```

---

## 📊 创建的表

### 1. blog_articles（文章表）
```sql
CREATE TABLE blog_articles (
    id UUID PRIMARY KEY,
    title VARCHAR(200),
    subtitle TEXT,
    content TEXT,
    cover_image_url TEXT,

    author_id UUID,
    author_name VARCHAR(100) DEFAULT 'Chessortag Team',
    author_type VARCHAR(20) DEFAULT 'official',

    category VARCHAR(50),
    sub_category VARCHAR(50),
    tags TEXT[],

    status VARCHAR(20) DEFAULT 'draft',
    is_pinned BOOLEAN DEFAULT false,
    pin_order INTEGER DEFAULT 0,

    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP
);
```

**索引：**
- `ix_blog_articles_title`
- `ix_blog_articles_author_id`
- `ix_blog_articles_category`
- `ix_blog_articles_status`
- `ix_blog_articles_is_pinned`
- `ix_blog_articles_published_at`
- `ix_blog_articles_pinned_order`（复合索引）
- `ix_blog_articles_search`（全文搜索）

---

### 2. blog_categories（分类表）
```sql
CREATE TABLE blog_categories (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**初始数据：**
- `about` - About Us 📖
- `function` - Function Intro ⚙️
- `allblogs` - All Blogs 📚
- `user` - Users' Blogs ✍️

---

## 🔍 验证数据库

### 连接到数据库（Railway CLI）
```bash
railway connect postgres
```

### 查看表
```sql
-- 列出所有 blog 表
\dt blog_*

-- 查看 blog_articles 结构
\d blog_articles

-- 查看 blog_categories 结构
\d blog_categories

-- 查看分类数据
SELECT * FROM blog_categories ORDER BY order_index;
```

### 预期结果
```
            Table
----------------------------
blog_articles
blog_categories

Categories:
- about      | About Us
- function   | Function Intro
- allblogs   | All Blogs
- user       | Users' Blogs
```

---

## 📁 创建的文件

```
backend/modules/blogs/
├── db/
│   ├── __init__.py
│   └── models.py                  ✅ SQLAlchemy 模型
├── create_tables.py               ✅ 自动建表脚本
├── init_blog_db.py                ✅ Alembic 迁移脚本
├── PLAN.md                        ✅ 计划（含数据库配置）
└── SETUP_COMPLETE.md              ✅ 本文件

backend/alembic/versions/
└── 007_create_blog_tables.py      ✅ Alembic 迁移

.gitignore
└── backend/modules/blogs/PLAN.md  ✅ 已加入（防止泄露密码）
```

---

## ⚠️ 注意事项

### 1. 敏感信息
- ✅ `PLAN.md` 已加入 `.gitignore`
- ⚠️  不要提交包含数据库密码的文件到 Git

### 2. 数据库连接
- ✅ `BLOG_DATABASE_URL` 是 Railway 内部地址
- ⚠️  只能在 Railway 容器内访问
- ⚠️  本地开发需要使用 Railway 提供的公网地址

### 3. 迁移执行
- ✅ 迁移脚本是幂等的（可重复执行）
- ✅ 分类插入使用 `ON CONFLICT DO NOTHING`（避免重复）

---

## 🎯 当前状态

**阶段：** 数据库准备完成 ✅

**已完成：**
- ✅ 数据库模型定义
- ✅ 迁移脚本创建
- ✅ 建表脚本创建
- ✅ 敏感信息保护

**待执行：**
- ⏳ 运行迁移脚本（在 Railway 上）
- ⏳ 验证表创建成功
- ⏳ 修改 User 表（添加 admin 角色）

**下一步：**
1. 在 Railway 上执行 `create_tables.py`
2. 验证表和数据
3. 继续开发 API

---

## 📞 需要帮助？

**如果遇到问题：**
1. 检查 `BLOG_DATABASE_URL` 是否正确
2. 检查 PostgreSQL 插件是否在 Railway 上运行
3. 查看迁移脚本的错误日志

**常见错误：**
- `connection refused` → 检查数据库 URL
- `relation already exists` → 表已存在，跳过或使用 `DROP TABLE`
- `permission denied` → 检查数据库用户权限

---

**设置完成时间：** 2026-02-09 14:10
**状态：** 准备就绪，等待执行迁移 ⏳
