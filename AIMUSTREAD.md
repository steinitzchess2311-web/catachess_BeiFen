# AI开发规范 - 必读

## 🚨 重要：双仓库同步策略

本项目使用**双仓库备份策略**，确保代码安全和版本一致性。

### 仓库配置

- **origin** → `Catachess` (主仓库)
  - URL: https://github.com/steinitzchess2311-web/Catachess
  - 用途：主要开发仓库

- **backup** → `catachess_BeiFen` (备份仓库)
  - URL: https://github.com/steinitzchess2311-web/catachess_BeiFen
  - 用途：完整备份，镜像主仓库

---

## ⚠️ 强制规则：每次改动必须推送到两个仓库

### 推送命令

每次完成代码修改并提交后，**必须**执行以下命令：

```bash
# 推送到主仓库 (origin)
git push origin main

# 推送到备份仓库 (backup)
git push backup main
```

或者一次性推送到两个仓库：

```bash
git push origin main && git push backup main
```

---

## ✅ 检查清单

在每次开发完成后，确认：

- [ ] 代码已提交到本地 main 分支
- [ ] 已推送到 origin (Catachess)
- [ ] 已推送到 backup (catachess_BeiFen)
- [ ] 两个仓库的 main 分支进度相同

### 验证命令

```bash
# 查看本地分支状态
git status

# 查看与远程的差异
git log origin/main..HEAD    # 本地领先 origin 的提交
git log backup/main..HEAD    # 本地领先 backup 的提交

# 如果有输出，说明需要推送
```

---

## 🔄 合并其他分支时

如果需要从远程仓库合并更新：

```bash
# 从 origin 拉取并合并
git fetch origin
git merge origin/main

# 从 backup 拉取并合并（如果需要）
git fetch backup
git merge backup/main

# 解决冲突后，推送到两个仓库
git push origin main && git push backup main
```

---

## 📌 重要提醒

1. **永远不要**只推送到一个仓库
2. **永远不要**让两个仓库的代码出现不一致
3. 如果某个仓库推送失败，**必须**重试直到成功
4. 如果遇到问题，优先保证 origin (主仓库) 的完整性

---

## 🛠️ 故障恢复

如果两个仓库出现不同步：

```bash
# 1. 确认当前状态
git log --oneline --graph --all -10

# 2. 强制同步 backup 到 origin 的状态
git push backup main --force

# ⚠️ 注意：--force 会覆盖远程历史，谨慎使用
```

---

## 📝 重要功能行为

### 文章详情页导航

当用户在查看文章详情时：
- 点击**任何分类按钮**（包括文章所属的当前分类）都会自动退出详情页，返回文章列表
- 例如：正在查看一篇"Our Stories"分类的文章，再次点击"Our Stories"按钮，会退出文章详情，显示该分类的所有文章列表
- 这确保用户可以快速在文章详情和列表视图之间切换

### 双容器渲染

- 文章列表和文章详情使用同一个容器（ContentArea）
- 视觉上保持一致性，切换流畅无跳转

---

**最后更新**: 2026-02-09
**维护者**: AI Development Team
