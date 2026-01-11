# R2 Bucket 配置修复方案

**日期**: 2026-01-11
**问题**: 老板只授权了一个 R2 bucket "workspace"，代码需要统一配置

---

## 问题分析

### 老板提供的资源
- **Bucket名称**: `workspace`
- **Access Token**: `OZNDN45QFE32HWA_BsA8C3j0mw_auBWAx-5rXW3k`
- **授权范围**: 仅此一个 bucket

### 代码中的混乱
1. ❌ `backend/storage/` 模块: 设计用于 `catachess-data` bucket（玩家对局历史）
2. ❌ `workspace/docs/phase1_progress.md:84`: 提到 `catachess-games` bucket
3. ❌ `workspace/storage/r2_client.py`: 读取 `R2_BUCKET` 变量
4. ❌ `workspace/README.md`: 写的是 `R2_BUCKET_NAME` 变量

### 正确的架构
- **workspace 模块**: 应该使用老板提供的 `workspace` bucket ✅
- **backend/storage 模块**: 暂时不需要（玩家对局功能未启用）⏸️

---

## 解决方案

### 方案一：统一使用 workspace bucket（推荐）

**原则**: workspace 模块独立，不依赖 backend/storage

#### 1. 修复环境变量配置

在 `/home/catadragon/Code/catachess/.env` 添加:

```bash
# ===== R2 Storage (Workspace Module) =====
R2_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY=OZNDN45QFE32HWA_BsA8C3j0mw_auBWAx-5rXW3k
R2_SECRET_KEY=<对应的secret-key>
R2_BUCKET=workspace
```

⚠️ **重要**: 你需要向老板要 `R2_SECRET_KEY`（与 access token 配对的 secret）

#### 2. 修复 workspace/storage/r2_client.py

**当前问题**: 代码在 line 287 读取 `R2_BUCKET`，但变量名和其他参数不一致

```python
# 当前代码 (r2_client.py:284-287)
endpoint = os.getenv("R2_ENDPOINT")
access_key = os.getenv("R2_ACCESS_KEY")
secret_key = os.getenv("R2_SECRET_KEY")
bucket = os.getenv("R2_BUCKET")  # ← 这个是对的
```

**检查**: 这个其实是对的！问题是 README.md 写错了。

#### 3. 修复 workspace/README.md

**错误内容** (line 149):
```bash
R2_BUCKET_NAME=catachess-workspace  # ❌ 错误
```

**应该改为**:
```bash
R2_BUCKET=workspace  # ✅ 正确（使用老板给的 bucket 名）
```

#### 4. 清理文档中的错误引用

**文件**: `workspace/docs/phase1_progress.md:84`
**错误**: `Bucket: catachess-games`
**修复**: 删除或改为 `Bucket: workspace`

---

## 需要的实际配置参数

请向老板索取完整的 R2 配置:

```bash
# 需要这些信息:
R2_ENDPOINT=?                    # Cloudflare R2 endpoint URL
R2_ACCESS_KEY=OZNDN45QFE32HWA_BsA8C3j0mw_auBWAx-5rXW3k  # 已有
R2_SECRET_KEY=?                  # ⚠️ 需要老板提供（与 access key 配对）
R2_BUCKET=workspace              # 已确认
```

**典型的 R2 endpoint 格式**:
```
https://<account-id>.r2.cloudflarestorage.com
```

---

## 实施清单

- [ ] 1. 向老板索取 `R2_SECRET_KEY` 和 `R2_ENDPOINT`
- [ ] 2. 修改 `/home/catadragon/Code/catachess/.env` 添加 R2 配置
- [ ] 3. 修改 `workspace/README.md:149` 改正变量名和 bucket 名
- [ ] 4. 修改 `workspace/docs/phase1_progress.md:84` 移除 catachess-games 引用
- [ ] 5. 更新 `backend/storage/README.md:93` 备注说明该模块暂未启用
- [ ] 6. 测试 workspace R2 连接

---

## backend/storage 模块怎么办？

**选项 A**: 暂时禁用（推荐）
- 该模块是设计用于玩家对局历史存储
- 目前重点是 workspace/study 系统
- Phase 4-5 测试失败，暂时不可用
- **建议**: 标记为 "未启用"，待未来需要时再申请独立 bucket

**选项 B**: 复用 workspace bucket（不推荐）
- 可以让 backend/storage 也使用 `workspace` bucket
- 但会混淆两个模块的数据（不同的 key pattern）
- 不符合架构设计原则

**监工建议**: 选择选项 A，专注修复 workspace 模块

---

## 验证方法

修复配置后，运行测试验证 R2 连接:

```bash
cd /home/catadragon/Code/catachess/backend/modules/workspace

# 测试 R2 client 连接（如果有测试的话）
pytest tests/test_r2*.py -v

# 或者创建简单的验证脚本
python3 -c "
from storage.r2_client import r2_client_from_env
client = r2_client_from_env()
print(f'Connected to bucket: {client.config.bucket}')
print('R2 connection successful!')
"
```

---

## 总结

**当前状态**:
- ❌ 没有配置 R2 环境变量
- ❌ 文档中 bucket 名称混乱
- ❌ README 中变量名不一致

**修复后**:
- ✅ 使用老板授权的 `workspace` bucket
- ✅ 统一环境变量命名
- ✅ 清理错误的 bucket 引用
- ✅ backend/storage 暂时标记为未启用

**下一步**: 等待老板提供 `R2_SECRET_KEY` 和 `R2_ENDPOINT`，然后执行修复清单。
