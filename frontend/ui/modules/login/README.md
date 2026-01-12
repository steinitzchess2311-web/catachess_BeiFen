# Login Module

登录模块 - 用户认证界面

## 🏗️ 架构：三端分离

遵循严格的关注点分离原则：

```
login/
├── layout/              # 纯 HTML 结构
│   └── LoginPage.html   # 登录页面布局
├── modules/             # TypeScript 业务逻辑
│   ├── core/            # 核心功能
│   │   ├── api.ts       # API 调用
│   │   └── storage.ts   # 本地存储
│   └── ui/              # UI 交互
│       ├── events.ts    # 事件处理
│       ├── render.ts    # 渲染更新
│       └── index.ts     # 入口点
└── styles/              # CSS 样式
    └── login.css        # 登录页样式
```

## ✨ 功能特性

- ✅ 邮箱/用户名登录
- ✅ 密码显示/隐藏切换
- ✅ 记住我功能（localStorage）
- ✅ JWT Token 存储
- ✅ 表单验证
- ✅ 错误处理和提示
- ✅ 加载状态
- ✅ Toast 通知
- ✅ 自动跳转已登录用户
- ✅ 响应式设计

## 🎨 设计特点

- 现代简洁的莫兰迪配色
- 流畅的动画过渡
- 清晰的视觉层次
- 优秀的用户体验

## 🔌 API 集成

- `POST /auth/login/json` - JSON 格式登录
- Token 存储：localStorage（记住我）或 sessionStorage
- 自动重定向到 workspace

## 🚀 使用方法

直接访问：`/login.html`

或通过查询参数指定重定向：`/login.html?redirect=/study`

## 📝 代码示例

```typescript
// API 调用
import { login } from './modules/core/api.js';

const result = await login('user@example.com', 'password');
if (result.success) {
    // 登录成功
    saveToken(result.data.access_token, remember);
}

// 存储管理
import { saveToken, getToken, isAuthenticated } from './modules/core/storage.js';

if (isAuthenticated()) {
    // 用户已登录
}
```

## 🔒 安全性

- 密码不在客户端明文存储
- JWT Token 安全存储
- HTTPS 传输（生产环境）
- CORS 配置正确
- 速率限制（后端）
