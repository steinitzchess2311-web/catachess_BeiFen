# Signup Module

注册模块 - 用户注册和邮箱验证界面

## 🏗️ 架构：三端分离

遵循严格的关注点分离原则：

```
signup/
├── layout/               # 纯 HTML 结构
│   └── SignupPage.html   # 注册页面布局
├── modules/              # TypeScript 业务逻辑
│   ├── core/             # 核心功能
│   │   └── api.ts        # API 调用
│   └── ui/               # UI 交互
│       ├── events.ts     # 事件处理
│       ├── render.ts     # 渲染更新
│       └── index.ts      # 入口点
└── styles/               # CSS 样式
    └── signup.css        # 注册页样式
```

## ✨ 功能特性

- ✅ 两步注册流程（信息填写 → 邮箱验证）
- ✅ 实时密码强度检测
- ✅ 密码确认验证
- ✅ 邮箱格式验证
- ✅ 服务条款同意
- ✅ 6位验证码验证
- ✅ 验证码重新发送（60秒倒计时）
- ✅ 进度指示器
- ✅ 表单验证和错误提示
- ✅ 加载状态
- ✅ Toast 通知
- ✅ 响应式设计

## 🎨 设计特点

- 分步骤的注册流程
- 清晰的进度指示
- 实时反馈（密码强度）
- 友好的错误提示
- 现代简洁的 UI

## 🔌 API 集成

- `POST /auth/register` - 用户注册
- `POST /auth/verify-signup` - 邮箱验证
- `POST /auth/resend-verification` - 重新发送验证码

## 📋 注册流程

1. **步骤 1：填写信息**
   - 邮箱（必填）
   - 用户名（可选）
   - 密码（必填，至少6位）
   - 确认密码（必填）
   - 同意服务条款（必填）

2. **步骤 2：邮箱验证**
   - 输入6位验证码
   - 验证码自动大写
   - 60秒后可重新发送
   - 验证成功后跳转登录

## 🚀 使用方法

直接访问：`/signup.html`

注册成功后自动跳转：`/login.html?from=signup`

## 📝 代码示例

```typescript
// 注册
import { register } from './modules/core/api.js';

const result = await register('user@example.com', 'password', 'username');
if (result.success) {
    // 显示验证步骤
    showStep(2);
}

// 验证
import { verifySignup } from './modules/core/api.js';

const result = await verifySignup('user@example.com', 'ABC123');
if (result.success) {
    // 跳转登录页
}
```

## 🎯 密码强度规则

- **弱**：< 6个字符
- **中**：6-10个字符，包含大小写或数字
- **强**：> 10个字符，包含大小写、数字和特殊字符

## 🔒 安全性

- 后端强制角色为 student（防止权限提升）
- 密码客户端加密传输
- 邮箱验证必须完成
- 验证码 15 分钟有效期
- 速率限制（后端）
