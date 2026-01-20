# Stage 03 Completion Report: Safety + Observability

## 1. Concurrency Guard (Best-effort)
- **`patch/studyContext.tsx`**:
    - 计算 tree 的 SHA-256（浏览器 `crypto.subtle`），写入 `X-Tree-Hash` 请求头。
    - 保存成功后记录 `lastSavedHash`，避免重复写入。

## 2. Observability
- **`patch/studyContext.tsx`**:
    - 保存开始/成功打印 `console.info`。
- **`patch/backend/study/api.py`**:
    - 记录接收到的 `X-Tree-Hash`（若存在）。

## 3. 失败重试行为
- 保存失败保持 `isDirty=true`，可手动或自动重试。

## 4. Trade-offs
- 仅为前端“最佳努力”防覆盖；服务端不强制校验 hash，以保持 tree.json schema 不变。
