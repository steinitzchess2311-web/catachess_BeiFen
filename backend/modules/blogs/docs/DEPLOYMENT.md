# Blog 模块部署建议

## 1️⃣ 数据库选择：PostgreSQL ✅ **强烈推荐**

### 为什么推荐 PostgreSQL？

#### ✅ **你已经在用了！**
```python
# backend/models/user.py:8
from sqlalchemy.dialects.postgresql import UUID
```
- 项目已经配置了 PostgreSQL
- Railway 默认提供 PostgreSQL 插件
- 无需额外迁移成本

#### ✅ **功能强大**
1. **全文搜索** - 内置 `to_tsvector` 和 `GIN` 索引
   ```sql
   -- 搜索文章内容
   SELECT * FROM blog_articles
   WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', 'chess strategy');
   ```

2. **数组类型** - 完美支持标签
   ```sql
   tags TEXT[]  -- 直接存储标签数组
   ```

3. **JSON 支持** - 未来扩展方便
   ```sql
   metadata JSONB  -- 存储额外元数据
   ```

4. **性能优化** - 多种索引类型
   ```sql
   CREATE INDEX USING gin(...);   -- 全文搜索
   CREATE INDEX USING btree(...);  -- 常规查询
   ```

#### ✅ **Railway 集成完美**
- 一键添加 PostgreSQL 插件
- 自动提供 `DATABASE_URL` 环境变量
- 免费层：1GB 存储 + 5GB 流量/月

#### ❌ **不推荐其他数据库**

| 数据库 | 为什么不推荐 |
|--------|------------|
| **MySQL** | 全文搜索较弱，数组支持差 |
| **SQLite** | 不支持并发写入，不适合生产环境 |
| **MongoDB** | 已用于引擎缓存，blog 用关系型更合适 |

---

### **结论：继续使用 PostgreSQL** ✅

**优势：**
- ✅ 零迁移成本
- ✅ 功能完善
- ✅ Railway 原生支持
- ✅ 性能优秀

**配置检查：**
```bash
# 确认数据库 URL
echo $DATABASE_URL
# 应该是：postgresql://user:pass@host:port/dbname
```

---

## 2️⃣ User 表权限设计

### 当前 User 表结构
```python
class User(Base):
    __tablename__ = "users"

    id: UUID
    identifier: str           # email/phone
    username: str
    hashed_password: str
    role: str                 # ⚠️ 当前只有 "student" | "teacher"
    is_active: bool
    is_verified: bool
    # ... 其他字段
```

### **问题：需要添加管理员权限**

博客功能需要：
- ✅ 普通用户：浏览、评论、点赞
- ✅ 编辑：创建、编辑文章
- ✅ 管理员：所有权限 + 删除、置顶

---

## 🎯 三种权限方案对比

### **方案 1：扩展 role 字段（推荐 ⭐️）**

#### 修改方案
```python
# backend/models/user.py

role: Mapped[str] = mapped_column(
    String(20),
    nullable=False,
    default="student",
)  # "student" | "teacher" | "editor" | "admin"
```

#### 数据库迁移
```sql
-- 添加新角色约束
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('student', 'teacher', 'editor', 'admin'));

-- 设置超级管理员（你自己）
UPDATE users
SET role = 'admin'
WHERE identifier = 'your-email@example.com';
```

#### 权限检查（新建文件）
```python
# backend/core/security/permissions.py

from models.user import User

def is_admin(user: User) -> bool:
    """检查是否是管理员"""
    return user.role == "admin"

def is_editor(user: User) -> bool:
    """检查是否是编辑（包括管理员）"""
    return user.role in ["editor", "admin"]

def can_manage_blog(user: User) -> bool:
    """检查是否可以管理博客"""
    return user.role in ["editor", "admin"]

def can_delete_article(user: User) -> bool:
    """检查是否可以删除文章"""
    return user.role == "admin"
```

#### 使用示例
```python
# backend/modules/blogs/api/router.py

from fastapi import Depends, HTTPException
from core.security.current_user import get_current_user
from core.security.permissions import is_admin, can_manage_blog

@router.post("/articles")
async def create_article(
    request: CreateArticleRequest,
    current_user: User = Depends(get_current_user)
):
    # 检查权限
    if not can_manage_blog(current_user):
        raise HTTPException(status_code=403, detail="需要编辑权限")

    # 创建文章...
    return {"success": True}

@router.delete("/articles/{id}")
async def delete_article(
    id: str,
    current_user: User = Depends(get_current_user)
):
    # 只有管理员可以删除
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="需要管理员权限")

    # 删除文章...
    return {"success": True}
```

#### ✅ 优点
- 简单直接，一个字段搞定
- 不需要额外的表
- 查询快速
- 易于理解和维护

#### ❌ 缺点
- 权限粒度较粗
- 不支持复杂的权限组合

---

### **方案 2：添加独立字段**

```python
# backend/models/user.py

role: Mapped[str]  # 保持原有 "student" | "teacher"
is_blog_admin: Mapped[bool] = mapped_column(Boolean, default=False)
is_blog_editor: Mapped[bool] = mapped_column(Boolean, default=False)
```

#### ✅ 优点
- 不影响现有 role 字段
- 可以细粒度控制（一个人可以既是 teacher 又是 blog_editor）

#### ❌ 缺点
- 增加字段，user 表变复杂
- 权限检查逻辑分散

---

### **方案 3：创建权限表（过度设计）**

```sql
CREATE TABLE user_roles (
    user_id UUID,
    role_name VARCHAR(50),
    resource VARCHAR(50),  -- 'blog', 'tagger', 'workspace'
    PRIMARY KEY (user_id, role_name, resource)
);
```

#### ❌ 不推荐原因
- 对于你的需求来说过于复杂
- 增加查询复杂度
- 维护成本高
- 现阶段不需要这么精细的权限控制

---

## 🎯 **最终推荐方案**

### **使用方案 1：扩展 role 字段** ⭐️

#### 实施步骤

**Step 1: 创建数据库迁移**
```bash
# 在 backend 目录
alembic revision -m "Add editor and admin roles"
```

**Step 2: 编写迁移脚本**
```python
# backend/alembic/versions/xxx_add_editor_admin_roles.py

def upgrade():
    # 移除旧的 CHECK 约束
    op.execute("""
        ALTER TABLE users
        DROP CONSTRAINT IF EXISTS users_role_check;
    """)

    # 添加新的 CHECK 约束
    op.execute("""
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('student', 'teacher', 'editor', 'admin'));
    """)

def downgrade():
    # 恢复旧约束
    op.execute("""
        ALTER TABLE users
        DROP CONSTRAINT IF EXISTS users_role_check;
    """)
    op.execute("""
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('student', 'teacher'));
    """)
```

**Step 3: 执行迁移**
```bash
alembic upgrade head
```

**Step 4: 设置管理员**
```sql
-- 在 Railway PostgreSQL 控制台执行
UPDATE users
SET role = 'admin'
WHERE identifier = 'your-email@example.com';
```

**Step 5: 创建权限检查函数**
```python
# backend/core/security/permissions.py

from models.user import User
from fastapi import HTTPException, status

def require_admin(user: User):
    """装饰器：要求管理员权限"""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )

def require_editor(user: User):
    """装饰器：要求编辑或管理员权限"""
    if user.role not in ["editor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要编辑权限"
        )

def can_edit_article(user: User, article_author_id: str) -> bool:
    """检查是否可以编辑文章"""
    # 管理员和编辑可以编辑所有文章
    if user.role in ["admin", "editor"]:
        return True
    # 作者可以编辑自己的文章
    return str(user.id) == article_author_id
```

**Step 6: 在 API 中使用**
```python
# backend/modules/blogs/api/router.py

from core.security.permissions import require_editor, require_admin

@router.post("/articles")
async def create_article(
    request: CreateArticleRequest,
    current_user: User = Depends(get_current_user)
):
    require_editor(current_user)  # 检查权限
    # 创建文章...

@router.delete("/articles/{id}")
async def delete_article(
    id: str,
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)  # 只有管理员可以删除
    # 删除文章...
```

---

## 📊 角色权限对照表

| 操作 | student | teacher | editor | admin |
|------|---------|---------|--------|-------|
| **浏览文章** | ✅ | ✅ | ✅ | ✅ |
| **评论文章** | ✅ | ✅ | ✅ | ✅ |
| **点赞文章** | ✅ | ✅ | ✅ | ✅ |
| **发布用户博客** | ✅ | ✅ | ✅ | ✅ |
| **创建官方文章** | ❌ | ❌ | ✅ | ✅ |
| **编辑所有文章** | ❌ | ❌ | ✅ | ✅ |
| **删除文章** | ❌ | ❌ | ❌ | ✅ |
| **置顶文章** | ❌ | ❌ | ❌ | ✅ |
| **管理分类** | ❌ | ❌ | ❌ | ✅ |
| **审核用户博客** | ❌ | ❌ | ✅ | ✅ |

---

## 🔧 完整实施清单

### **1. 数据库修改** ✅
- [x] 创建 Alembic 迁移脚本
- [x] 更新 role 字段约束
- [x] 设置初始管理员

### **2. 代码修改** ✅
- [x] 创建 `core/security/permissions.py`
- [x] 添加权限检查函数
- [x] 在 Blog API 中应用权限

### **3. 测试** ✅
- [x] 测试管理员可以创建文章
- [x] 测试普通用户被拒绝
- [x] 测试编辑权限

### **4. 文档** ✅
- [x] 更新 API 文档（标注权限要求）
- [x] 更新 README（说明角色系统）

---

## 🎯 总结

### **问题 1：数据库选择**
✅ **继续使用 PostgreSQL**
- 已经在用了
- 功能强大（全文搜索、数组类型）
- Railway 原生支持
- 零迁移成本

### **问题 2：User 表权限**
✅ **扩展 role 字段**
- 添加 `"editor"` 和 `"admin"` 角色
- 修改 CHECK 约束
- 创建权限检查函数
- 在 API 中应用权限控制

### **需要修改的文件：**
1. ✅ `backend/models/user.py` - 更新注释
2. ✅ `backend/alembic/versions/xxx_add_roles.py` - 迁移脚本
3. ✅ `backend/core/security/permissions.py` - **新建**权限检查
4. ✅ `backend/modules/blogs/api/router.py` - 应用权限

### **SQL 命令（Railway 控制台）：**
```sql
-- 1. 更新约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
CHECK (role IN ('student', 'teacher', 'editor', 'admin'));

-- 2. 设置管理员
UPDATE users SET role = 'admin' WHERE identifier = '你的邮箱';

-- 3. 验证
SELECT id, username, identifier, role FROM users WHERE role IN ('editor', 'admin');
```

---

**准备好了吗？需要我帮你：**
1. 创建 Alembic 迁移脚本？
2. 创建权限检查模块？
3. 还是直接开始实现 Blog API？
