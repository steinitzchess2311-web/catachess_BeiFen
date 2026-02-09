# User Role Management Guide

## 🎯 Quick Start: 提升自己为Admin

### 方法1: 使用Python脚本（最简单）

```bash
cd backend
export DATABASE_URL='postgresql://user:password@host:port/database'
python scripts/promote_to_admin.py catadragon99@gmail.com
```

### 方法2: 使用API端点

**前提**: 你需要先有一个admin账户来调用这个API

```bash
curl -X POST http://localhost:8000/api/admin/roles/promote-to-admin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "catadragon99@gmail.com"}'
```

### 方法3: 直接SQL（最快）

```sql
-- 连接到数据库
psql $DATABASE_URL

-- 提升用户为admin
UPDATE users SET role = 'admin' WHERE identifier = 'catadragon99@gmail.com';

-- 验证
SELECT id, identifier, username, role FROM users WHERE identifier = 'catadragon99@gmail.com';
```

---

## 📊 Role Management API

所有API端点需要admin权限（除了第一次提升自己）

### 1. 查看所有用户

```http
GET /api/admin/roles/users
Authorization: Bearer <token>
```

可选参数:
- `role_filter`: 按角色筛选 (student/teacher/editor/admin)

### 2. 更新单个用户角色

```http
POST /api/admin/roles/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",  // 或者使用 user_id
  "new_role": "editor"
}
```

### 3. 批量更新角色

```http
POST /api/admin/roles/batch-update
Authorization: Bearer <token>
Content-Type: application/json

{
  "emails": ["user1@example.com", "user2@example.com"],
  "new_role": "editor"
}
```

### 4. 快速提升为Admin

```http
POST /api/admin/roles/promote-to-admin
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 5. 角色统计

```http
GET /api/admin/roles/stats
Authorization: Bearer <token>
```

---

## 🖥️ Admin Panel (Web UI)

访问: `http://your-domain/admin/roles`

功能:
- ✅ 查看所有用户列表
- ✅ 按角色筛选
- ✅ 修改用户角色
- ✅ 一键提升为Admin
- ✅ 实时角色统计

**注意**: 只有admin角色的用户可以访问此页面

---

## 🔐 角色权限说明

| 角色 | 权限 |
|------|------|
| **student** | 基础用户，无特殊权限 |
| **teacher** | 教师用户，可能有额外教学权限 |
| **editor** | 可以创建/编辑/删除自己的博客文章 |
| **admin** | 完全权限：管理所有文章、置顶、管理用户角色 |

---

## 📝 常见场景

### 场景1: 第一次设置Admin

```bash
# 1. 使用脚本提升自己
cd backend
export DATABASE_URL='postgresql://...'
python scripts/promote_to_admin.py your-email@example.com

# 2. 登录前端，访问 /admin/roles
# 3. 现在你可以通过UI管理其他用户了
```

### 场景2: 批量设置Editor

```python
# 使用API批量提升10个用户为editor
import requests

token = "your-jwt-token"
emails = [f"user{i}@example.com" for i in range(1, 11)]

response = requests.post(
    "http://localhost:8000/api/admin/roles/batch-update",
    headers={"Authorization": f"Bearer {token}"},
    json={"emails": emails, "new_role": "editor"}
)
print(response.json())
```

### 场景3: 查看所有Admin

```bash
cd backend
python scripts/check_blog_admins.py
```

---

## ⚠️ 注意事项

1. **第一个Admin**: 必须通过脚本或SQL手动创建第一个admin
2. **权限检查**: API端点会验证JWT token和角色
3. **数据库约束**: 确保已运行 `/api/blog-admin/setup-permissions` 来允许editor/admin角色
4. **安全性**: 不要在生产环境暴露role management API（使用内网或VPN）

---

## 🛠️ 故障排除

### 问题: "Admin role required for this operation"

**原因**: 你的账户还不是admin
**解决**: 使用 `promote_to_admin.py` 脚本提升自己

### 问题: "CHECK constraint violation"

**原因**: 数据库还不允许editor/admin角色
**解决**:
```bash
curl -X POST http://localhost:8000/api/blog-admin/setup-permissions
```

### 问题: 看不到Create Button

**原因**:
1. 角色不是editor或admin
2. 前端没有正确获取用户角色

**解决**:
1. 查看右上角调试徽章，确认你的role
2. 检查 `/user/profile` API是否返回role字段
3. 清除localStorage并重新登录
