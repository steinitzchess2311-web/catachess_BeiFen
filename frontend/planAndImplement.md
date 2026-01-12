0) 前端总原则 Contract
三端分离（必须强制）

layout/：只负责「结构与占位」。纯 HTML（div/section/aside/button/input），只写格子、区域、层级、语义属性（data-slot / data-node-id）。

❌ 不允许写颜色、阴影、动画、字体等“美术”

✅ 允许写 class 名（如 slot-toolbar、panel-left），但 class 不携带视觉意义

styles/：只负责「视觉」。使用 CSS variables + token（莫兰迪色系），支持一键换主题、未来扩展多套主题。

modules/：只负责「行为 + 状态 + 与后端通信 + WebSocket 事件订阅」。

不写布局，不写视觉，只操作 DOM、store、router、api/ws

1) 目录结构（强约束）

建议你把 workspace 前端放在（示例）：

frontend/ui/modules/workspace/
  layout/
    AppShell.html
    WorkspacePage.html
    StudyPage.html
    components/
      TopNav.html
      LeftSidebar.html
      Toolbar.html
      DesktopCanvas.html
      TreeView.html
      RightPanel.html
      DialogShare.html
      DialogImport.html
      DialogExport.html
      PanelNotifications.html
      PanelVersions.html
      PanelDiscussions.html
      PanelPresence.html

  styles/
    tokens/
      colors.morandi.css
      spacing.css
      radius.css
      typography.css
      shadow.css
      zindex.css
    theme/
      theme.base.css          (把 tokens 映射到语义变量)
      theme.morandi.light.css
      theme.morandi.dark.css
      theme.alt.placeholder.css (给未来“切换颜色”留位)
    components/
      buttons.css
      inputs.css
      cards.css
      panels.css
      chessboard.css          (只做视觉，不做棋逻辑)
      markdown.css
    pages/
      workspace.css
      study.css

  modules/
    bootstrap/
      mount.ts
      router.ts
      dom.ts
    state/
      store.ts
      reducers.ts
      selectors.ts
      types.ts
    api/
      client.ts
      endpoints.ts
      idempotency.ts
    realtime/
      ws.ts
      eventEnvelope.ts
      eventRouter.ts
      subscriptions.ts
    features/
      nodes/
        nodes.controller.ts
        nodes.dragdrop.ts
        nodes.contextmenu.ts
      acl/
        acl.controller.ts
        acl.dialog.ts
      study/
        study.controller.ts
        study.editor.ts
        study.chapters.ts
        study.annotations.ts
        study.import.ts
        study.export.ts
        study.versions.ts
      discussions/
        discussions.controller.ts
        discussions.mentions.ts
        discussions.reactions.ts
      notifications/
        notifications.controller.ts
      presence/
        presence.controller.ts
        presence.heartbeat.ts
    ui/
      bindings/
        bindTopNav.ts
        bindToolbar.ts
        bindSidebar.ts
        bindDesktop.ts
        bindStudy.ts
      render/
        renderWorkspace.ts
        renderTree.ts
        renderDesktop.ts
        renderStudy.ts
        renderNotifications.ts
        renderDiscussions.ts

  assets/
    icons/
    logo/


你要“纯 html 画格子”，所以 layout 用 .html 文件或 string template 都行；关键是 layout 不包含 styles 与行为。

2) Layout 规范（纯 HTML 画格子）
2.1 AppShell.html（全局骨架）

只负责分区：顶部导航 / 左侧栏 / 主工作区 / 右侧信息栏 / 弹窗层

<div class="app-shell" data-layout="app-shell">
  <!-- Top -->
  <header class="slot-topnav" data-slot="topnav"></header>

  <!-- Left -->
  <aside class="slot-leftsidebar" data-slot="leftsidebar"></aside>

  <!-- Main -->
  <main class="slot-main" data-slot="main"></main>

  <!-- Right -->
  <aside class="slot-rightpanel" data-slot="rightpanel"></aside>

  <!-- Overlay -->
  <div class="slot-overlay" data-slot="overlay"></div>

  <!-- Toast -->
  <div class="slot-toast" data-slot="toast"></div>
</div>

必须的 data-slot（模块绑定点）

topnav：搜索、通知铃铛、用户菜单、主题切换

leftsidebar：树/共享/回收站 tabs

main：Workspace 桌面或 Study 编辑器

rightpanel：讨论/版本/在线/导出进度等

overlay：分享/导入/导出/确认弹窗

toast：轻提示（导出完成/失败）

2.2 WorkspacePage.html（桌面模式 + 列表模式）
<section class="page-workspace" data-page="workspace">
  <div class="slot-toolbar" data-slot="toolbar"></div>

  <div class="workspace-body" data-layout="workspace-body">
    <!-- 视图切换：desktop / tree -->
    <section class="slot-desktop" data-slot="desktop"></section>
    <section class="slot-tree" data-slot="tree"></section>
  </div>
</section>


要求：

desktop 与 tree 两个区域都存在，但通过 modules 控制显示隐藏（本地存储 viewMode）

拖拽只发生在 desktop（卡片）与 tree（树）两种 UI，行为逻辑在 modules 里统一复用

2.3 DesktopCanvas.html（Figma 式桌面画布）
<div class="desktop-canvas" data-component="desktop-canvas">
  <div class="desktop-viewport" data-role="viewport">
    <div class="desktop-grid" data-role="grid"></div>

    <!-- 节点卡片容器 -->
    <div class="desktop-nodes" data-role="nodes"></div>

    <!-- 选中框 / 拖拽占位 -->
    <div class="desktop-selection" data-role="selection"></div>
  </div>
</div>


节点卡片模板（由 renderDesktop.ts 填充）：

<div class="node-card"
     data-node-id="NODE_ID"
     data-node-type="workspace|folder|study"
     draggable="true">
  <div class="node-card-title" data-role="title"></div>
  <div class="node-card-meta" data-role="meta"></div>
</div>

2.4 StudyPage.html（棋盘/章节/注释/变体/协作/讨论）
<section class="page-study" data-page="study">
  <div class="slot-toolbar" data-slot="toolbar"></div>

  <div class="study-body" data-layout="study-body">
    <!-- 左：章节列表 -->
    <aside class="study-left" data-slot="study-chapters"></aside>

    <!-- 中：棋盘 + 走法 -->
    <section class="study-center" data-layout="study-center">
      <div class="study-board" data-slot="study-board"></div>
      <div class="study-movelist" data-slot="study-movelist"></div>
    </section>

    <!-- 右：注释/讨论/版本/在线 -->
    <aside class="study-right" data-slot="study-right"></aside>
  </div>

  <!-- 底部：协作栏（可选固定） -->
  <footer class="study-collabbar" data-slot="presence-bar"></footer>
</section>

3) Styles：莫兰迪色系 + 一键换主题 + 未来扩展
3.1 Token（固定的“原材料”）

styles/tokens/colors.morandi.css 只定义原色，不带语义：

:root {
  /* Morandi base palette (soft, dusty) */
  --m-ink: #2F3437;
  --m-mist: #E7E4DE;
  --m-sand: #D9D2C7;
  --m-sage: #A8B2A4;
  --m-clay: #C3A6A0;
  --m-slate: #8F9AA3;
  --m-rose: #D3B3B3;
  --m-lake: #A3B7C1;
  --m-cream: #F3F0EA;
  --m-shadow: rgba(0,0,0,0.08);
}


你后续想“换颜色系”，只需要再来一份 colors.<new>.css。

3.2 语义变量（主题层）

styles/theme/theme.base.css：把 token 映射到 UI 语义：

:root {
  --bg: var(--m-cream);
  --panel: var(--m-mist);
  --card: #ffffff;

  --text: var(--m-ink);
  --muted: var(--m-slate);

  --primary: var(--m-sage);
  --danger: var(--m-clay);
  --accent: var(--m-lake);

  --border: rgba(47,52,55,0.12);
  --shadow: var(--m-shadow);

  --focus: var(--m-lake);
}


theme.morandi.dark.css：只覆盖语义变量（不改组件 CSS）：

:root[data-theme="dark"]{
  --bg: #1F2326;
  --panel: #2A2F33;
  --card: #2F3437;

  --text: #EDE9E2;
  --muted: #A9B0B6;

  --border: rgba(237,233,226,0.12);
  --shadow: rgba(0,0,0,0.25);
}

3.3 一键切换颜色系（为未来留钩子）

你要求“后续留东西”：我们用两个 data 属性：

data-theme="light|dark"

data-palette="morandi|alt1|alt2"

将来你要换 palette，只要加载不同 token 文件，或用 CSS 覆盖：

:root[data-palette="morandi"] { /* default tokens */ }
:root[data-palette="alt1"] { /* override token values */ }


前端切换按钮只需要：

document.documentElement.dataset.theme = "dark";
document.documentElement.dataset.palette = "morandi";

4) 模块化执行模型：API / WS / Store / Render
4.1 Store（单一事实源）

所有 UI 都是 store 的投影。任何 WS 事件到来，先更新 store，再触发 render。

store 核心 state（建议最小起步）：

{
  session: { userId, token },
  ui: {
    viewMode: "desktop" | "tree",
    rightPanelTab: "discussions"|"versions"|"presence"|"notifications",
    theme: { theme: "light|dark", palette: "morandi|..." },
    dialogs: { shareOpen, importOpen, exportOpen, confirmOpen }
  },
  nodes: {
    byId: { [id]: Node },
    childrenByParent: { [parentId]: string[] },
    layoutByNode: { [id]: { x,y,w,h } },  // desktop card positions
    selected: { ids: string[] }
  },
  studies: {
    byId: { [studyId]: StudyMeta },
    chaptersByStudy: { [studyId]: Chapter[] },
    active: { studyId, chapterId, plyIndex }
  },
  discussions: { threadsByTargetId, repliesByThreadId },
  notifications: { items, unreadCount },
  presence: { byStudyId: { users: [], cursors: {} } },
  jobs: { exportById: { status, progress, downloadUrl } }
}

4.2 API Client（幂等）

你后端最终一定会遇到重试，所以前端统一加 Idempotency-Key：

modules/api/idempotency.ts：生成 uuid

client.ts：对 POST/PATCH/PUT 自动附加头

4.3 WebSocket 事件订阅（你给的事件总览直接用）
eventEnvelope 统一结构（前后端对齐）

前端假设后端 WS 推送 payload 形如：

{
  "event_id":"...",
  "event_type":"study.move.added",
  "target":{"type":"study","id":"..."},
  "actor_id":"...",
  "payload":{},
  "timestamp":"...",
  "version":1
}


在 eventRouter.ts 做映射：

event_type → reducer/action

对 store 做幂等去重（event_id 已处理过就忽略）

5) 与后端 hooks 的连接方式（按功能直接对齐）

下面给你一个强制规则：

任何按钮点击 = 调 API（command）
任何 UI 更新 = 吃 WS 事件（event）
（本地乐观更新可做，但最终以 WS 为准）

例子（节点移动）：

用户拖拽卡片 → POST /nodes/move

后端广播 folder.moved / study.moved / workspace.moved + layout.updated

前端收到事件 → 更新 nodes.childrenByParent + layoutByNode → renderDesktop()





X 6) Implement Plan（Stage / Step / Checkbox，极清晰.每一行结束后在前面打勾）
X Stage 0 — 工程骨架与三端分离落地（必须先完成）

X  建立目录结构（layout/styles/modules/assets）

X  Layout：把 AppShell.html + WorkspacePage.html + StudyPage.html 放进去（只占位）

X  Styles：建立 tokens + theme.base + morandi light/dark（先不追求完美）

X  Modules：mount.ts 把 layout 注入 DOM（例如 fetch html / innerHTML）

X  Router：/workspaces/:id、/studies/:id 基本路由切换（只切页面容器）

X  Store：最小 store（ui + session + nodes 空结构）

X  Render：renderWorkspace() / renderStudy() 先只把“空状态”画出来（无数据）

X 交付物：

X 能打开页面，看到完整格子结构

X 主题切换按钮能切 light/dark（只是变量变化）

X Stage 1 — Node 系统（Workspace/Folder/Study）的桌面视图（desktop）
X Step 1.1 数据模型 + API 对接（只拉取/创建）

X  GET /workspaces 或 GET /workspaces/{id}（你实际端点按后端定）

X  POST /workspaces 创建 workspace（按钮）

X  POST /folders 创建 folder

X  POST /studies 创建 study

X  Store：nodes.byId / childrenByParent 写入

X  renderDesktop：把 nodes 渲染成 node-card

X Step 1.2 桌面拖拽（只做前端交互 + move API）

X  nodes.dragdrop.ts：dragstart/dragover/drop

X  drop 时调用 POST /nodes/move（带 parentId）

X  不做最终 UI 更新（等待 WS moved 事件）

X  做最小乐观：显示“移动中…”占位（可选）

X Step 1.3 右键菜单（重命名/删除/复制/分享）

X  nodes.contextmenu.ts：右键打开菜单（layout 只留容器）

X  重命名：PUT /folders/{id}、PUT /workspaces/{id}、PUT /studies/{id}

X  删除：DELETE /nodes/{id}（软删）

X  复制：POST /nodes/copy（先做 API，不做事件更新，等你补 event）

X  分享：打开 share dialog（仅 UI）

X 交付物：

X 桌面能创建/显示/拖拽/右键菜单操作

X 所有最终更新由 WS 事件落地（下一 Stage 接）

X Stage 2 — WebSocket 事件闭环（前端订阅你那份事件总览）
X Step 2.1 WS 基础设施

X  ws.ts：connect/reconnect/backoff

X  eventEnvelope.ts：类型定义 + 校验

X  eventRouter.ts：event_type → reducer

X  去重：event_id 已处理缓存（LRU 5000 条）

X Step 2.2 Node 事件映射（最重要）

X  workspace.created/updated/deleted/moved → nodes reducer

X  folder.created/renamed/deleted/moved → nodes reducer

X  study.created/updated/deleted/moved → nodes reducer

X  layout.updated → layout reducer（desktop 卡片位置）

X  acl.* → acl reducer（影响 UI 权限）

X 交付物：

X 你在两个浏览器开同一 workspace：A 创建 folder，B 实时出现

X A 拖拽移动，B 实时跟随

X Stage 3 — Study 编辑器（章节/走法/注释/导入导出）
X Step 3.1 Study 基础加载与章节列表

X  GET /studies/{id} 元信息

X  GET /studies/{id}/chapters（或你后端实际端点）

X  renderChapters：章节列表 + 选中态

X  chapter rename：触发 study.chapter.renamed（对应 API 如果是 PUT chapter）

X Step 3.2 棋盘交互（只做输入，不做棋引擎）

X  board 容器占位（layout 已有）

X  点击走棋 → study.move.added 对应 API（你后端具体端点你定）

X  右键删除走法 → study.move.deleted

X  Shift+点击变体 → variation.promoted / variation.reordered（按你后端行为）

X Step 3.3 注释面板 + NAG

X  Markdown 编辑器（最简 textarea 起步）

X  add/edit/delete annotation → study.move_annotation.*

X  NAG 按钮点击 → 仍走 study.move_annotation.updated（payload 区分 nag）

X Step 3.4 导入/导出

X  导入对话框：文件上传/粘贴

X  POST /studies/{id}/import-pgn → 等 study.chapter.imported

X  POST /studies/{id}/export → jobId

X  GET /export-jobs/{job_id} 轮询/或 WS 推送

X  完成后显示下载按钮（toast + right panel）

X 交付物：

X Study 页面功能可用（单人），且多端同步靠 WS 事件闭环

X Stage 4 — Discussions（GitHub Issues 风格）+ Mentions + Reactions
X Step 4.1 Thread & Reply CRUD

X  列表 GET /discussions?target=...

X  新建 thread POST /discussions

X  回复 POST /discussions/{thread_id}/replies

X  编辑/删除（按你的端点）

X  resolve/pin

X Step 4.2 @提及与自动补全

X  输入 @ → 请求用户列表（你后端可 GET /users?q=...）

X  发帖时解析 @mentions（前端可做，后端也可做）

X  收到 discussion.mention → 触发通知 created

X 交付物：

X 讨论面板可用且实时同步

X Stage 5 — Notifications + Preferences + 邮件/站内联动（留接口）
X Step 5.1 通知中心

X  GET /notifications 拉取

X  unread badge

X  read / bulk-read / dismiss

X Step 5.2 preferences（留 hooks）

X  页面占位 + 保存按钮

X  PUT /notifications/preferences

X  UI 里保留：站内/邮件渠道选择、勿扰时段

X Stage 6 — Presence（在线状态）+ Cursor（协作体验）
X Step 6.1 Heartbeat

X  进入 study 自动 POST /presence/heartbeat

X  每 30s 发送（包含 chapterId + plyIndex）

X  处理 presence.user_* 事件更新头像条

X Step 6.2 Cursor moved（WS）

X  在棋盘上移动/切步时发送 cursor state（WS）

X  收到 presence.cursor_moved → 渲染他人光标标记

X Stage 7 — Versions / Diff / Rollback（高价值）

X  Versions panel：GET /studies/{id}/versions

X  Diff view：GET /studies/{id}/versions/{v}/diff

X  Rollback：POST /studies/{id}/rollback（带 version）

X  收到 study.rollback / study.snapshot.created 更新时间线

X 7) 关键 UI 组件与“钩子绑定表”（前端必须照这个绑）
X 7.1 必须存在的 DOM 钩子（layout data-slot）

X [data-slot="toolbar"]：新建/导入/导出/分享/自动排列/视图切换

X [data-slot="desktop"]：桌面画布渲染 + 拖拽

X [data-slot="tree"]：树视图渲染 + 拖拽

X [data-slot="overlay"]：所有对话框 mount 点

X [data-slot="rightpanel"]：讨论/版本/通知/在线 tabs

X [data-slot="toast"]：提示系统

X modules/ui/bindings 里每个 bindXxx 只做两件事：

X 找 DOM

X 绑定事件监听 → 调 controller

X 8) 你要的“颜色一键切换”具体怎么做（落地）

X TopNav 放两个开关：

X Theme：light/dark

X Palette：morandi / alt1 / alt2（先 alt 占位 disabled）

X 行为在 bindTopNav.ts：

X  点击 theme toggle → store.ui.theme.theme = ... → 更新 documentElement.dataset.theme

X  点击 palette dropdown → dataset.palette = ...

X  保存到 localStorage：ui.theme

X 这样你后续只要加一份 token 文件，就能“换色系”。

X 9) 最后：你现在就能开始写的最小可运行版本（MVP 顺序）

X 如果你想最快看到成果（但仍遵守三端分离），推荐按这个顺序切：

X Stage 0（骨架 + 主题切换）

X Stage 1.1（节点列表显示 + 创建按钮）

X Stage 2.1~2.2（WS 闭环）

X Stage 1.2（拖拽 move）

X Stage 3（Study 编辑器最小可用：章节+注释）

X 再补讨论/通知/在线/版本
