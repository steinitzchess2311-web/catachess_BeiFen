# Storage Module Status

**状态**: ⏸️ **暂未启用 (Not Currently Used)**

**日期**: 2026-01-11

---

## 说明

此模块 (`backend/storage/`) 是设计用于**玩家对局历史存储**的，原计划使用独立的 R2 bucket (`catachess-data`)。

**当前情况**:
- ❌ 老板未授权此模块的 R2 bucket
- ❌ 此模块的功能暂时不在开发优先级内
- ✅ 重点是 **workspace 模块** (`backend/modules/workspace/`)

---

## Workspace 模块 vs Storage 模块

### backend/storage/ (本模块 - 未启用)
**用途**: 玩家对局历史
- 存储玩家下的棋局 PGN
- 存储引擎分析结果
- 存储训练数据

**需要的 bucket**: `catachess-data` (未授权)

### backend/modules/workspace/ (✅ 正在使用)
**用途**: 学习工作空间系统
- Study/Chapter 管理
- PGN 导入与编辑
- 讨论系统
- 版本历史

**使用的 bucket**: `workspace` (已授权 ✅)

---

## R2 配置情况

**老板授权的资源**:
- Bucket: `workspace` (仅一个)
- Access Key: `2e32a213937e6b75316c0d4ea8f4a6e1`
- 用途: workspace 模块专用

**未授权的资源**:
- `catachess-data` bucket (本模块需要)
- `catachess-games` bucket (文档中的错误引用)

---

## 何时启用此模块

当满足以下条件时可以启用:

1. ✅ 玩家对局历史功能需求明确
2. ✅ 老板授权独立的 R2 bucket (`catachess-data` 或其他名称)
3. ✅ 提供该 bucket 的 access key 和 secret key
4. ✅ workspace 模块已稳定运行（Phase 4-5 测试通过）

---

## 架构决策记录

**为什么不让两个模块共用一个 bucket？**

虽然技术上可行（通过不同的 key prefix 区分），但不推荐：

| 考虑因素 | 说明 |
|---------|------|
| **数据隔离** | 玩家对局 vs 学习资料应该隔离 |
| **权限管理** | 未来可能需要不同的访问策略 |
| **成本核算** | 分开的 bucket 便于成本追踪 |
| **故障隔离** | 一个 bucket 故障不影响另一个 |
| **架构清晰** | 符合单一职责原则 |

---

## 当前项目 R2 使用情况

```
catachess/
├── backend/storage/              ⏸️ 未启用 (需要 catachess-data bucket)
│   └── game_history/             玩家对局存储
│
└── backend/modules/workspace/    ✅ 正在使用 (workspace bucket)
    └── storage/                  Study/Chapter 存储
```

---

## 如果需要启用此模块

### 步骤 1: 向老板申请资源
请求创建新的 R2 bucket 并获取凭证:
```
Bucket Name: catachess-data (或老板指定的名称)
Access Key: [待提供]
Secret Key: [待提供]
```

### 步骤 2: 配置环境变量
在 `.env` 中添加:
```bash
# Game History Storage (backend/storage module)
GAME_STORAGE_R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
GAME_STORAGE_R2_ACCESS_KEY=xxx
GAME_STORAGE_R2_SECRET_KEY=xxx
GAME_STORAGE_R2_BUCKET=catachess-data
```

### 步骤 3: 更新代码
修改 `backend/storage/core/config.py` 使用新的环境变量名:
```python
# 使用 GAME_STORAGE_* 前缀避免与 workspace 模块冲突
"GAME_STORAGE_R2_ENDPOINT": "endpoint",
"GAME_STORAGE_R2_BUCKET": "bucket",
# ...
```

### 步骤 4: 测试连接
```bash
cd /home/catadragon/Code/catachess/backend
python3 -c "
from storage.core.config import StorageConfig
config = StorageConfig.from_env()
print(f'Connected to: {config.bucket}')
"
```

---

## 监工备注

**优先级**: P3 (低)
- workspace 模块 Phase 4-5 还在失败中（64.6% 和 15.9% 测试通过率）
- 先把 workspace 修好再考虑启用玩家对局存储
- 目前没有玩家对局功能的需求

**状态**: 等待需求和资源授权

---

**最后更新**: 2026-01-11 by 监工
