// frontend/ui/modules/workspace/modules/bootstrap/dom.ts
var cache = /* @__PURE__ */ new Map();
async function loadHtml(path) {
  if (cache.has(path)) {
    return cache.get(path);
  }
  const response = await fetch(path);
  const html = await response.text();
  cache.set(path, html);
  return html;
}
function mountHtml(container, html) {
  container.innerHTML = html;
}

// frontend/ui/modules/workspace/modules/state/reducers.ts
var initialState = {
  session: { userId: null, token: null },
  ui: {
    viewMode: "desktop",
    rightPanelTab: "discussions",
    theme: { theme: "light", palette: "morandi" },
    dialogs: { shareOpen: false, importOpen: false, exportOpen: false, confirmOpen: false },
    toast: { message: null }
  },
  nodes: {
    byId: {},
    childrenByParent: {},
    layoutByNode: {},
    selected: { ids: [] }
  },
  studies: {
    byId: {},
    chaptersByStudy: {},
    versionsByStudy: {},
    active: { studyId: null, chapterId: null, plyIndex: 0 }
  },
  discussions: { threadsByTargetId: {}, repliesByThreadId: {} },
  notifications: { items: [], unreadCount: 0 },
  presence: { byStudyId: {} },
  jobs: { exportById: {} },
  acl: { rolesByNode: {} }
};
function rootReducer(state, action) {
  switch (action.type) {
    case "UI_SET_VIEW_MODE":
      return { ...state, ui: { ...state.ui, viewMode: action.payload } };
    case "UI_SET_THEME":
      return { ...state, ui: { ...state.ui, theme: action.payload } };
    case "UI_SET_RIGHT_TAB":
      return { ...state, ui: { ...state.ui, rightPanelTab: action.payload } };
    case "UI_SET_DIALOGS":
      return { ...state, ui: { ...state.ui, dialogs: { ...state.ui.dialogs, ...action.payload } } };
    case "UI_SET_TOAST":
      return { ...state, ui: { ...state.ui, toast: { message: action.payload } } };
    case "SESSION_SET":
      return { ...state, session: { ...state.session, ...action.payload } };
    case "NODES_UPSERT":
      return { ...state, nodes: upsertNodes(state.nodes, action.payload || []) };
    case "NODES_REMOVE":
      return { ...state, nodes: removeNodes(state.nodes, action.payload || []) };
    case "NODES_SET_CHILDREN":
      return {
        ...state,
        nodes: { ...state.nodes, childrenByParent: { ...state.nodes.childrenByParent, ...action.payload } }
      };
    case "NODES_SET_LAYOUT":
      return {
        ...state,
        nodes: { ...state.nodes, layoutByNode: { ...state.nodes.layoutByNode, ...action.payload } }
      };
    case "NODES_SELECT":
      return { ...state, nodes: { ...state.nodes, selected: { ids: action.payload || [] } } };
    case "STUDY_SET_ACTIVE":
      return { ...state, studies: { ...state.studies, active: { ...state.studies.active, ...action.payload } } };
    case "STUDY_SET_CHAPTERS":
      return {
        ...state,
        studies: {
          ...state.studies,
          chaptersByStudy: { ...state.studies.chaptersByStudy, ...action.payload }
        }
      };
    case "STUDY_SET_VERSIONS":
      return {
        ...state,
        studies: {
          ...state.studies,
          versionsByStudy: { ...state.studies.versionsByStudy, ...action.payload }
        }
      };
    case "DISCUSSIONS_SET":
      return { ...state, discussions: { ...state.discussions, ...action.payload } };
    case "NOTIFICATIONS_SET":
      return { ...state, notifications: { ...state.notifications, ...action.payload } };
    case "ACL_SET":
      return { ...state, acl: { rolesByNode: { ...state.acl.rolesByNode, ...action.payload } } };
    case "PRESENCE_SET":
      return { ...state, presence: { ...state.presence, ...action.payload } };
    case "JOBS_SET":
      return { ...state, jobs: { ...state.jobs, ...action.payload } };
    default:
      return state;
  }
}
function upsertNodes(nodesState, nodes) {
  const byId = { ...nodesState.byId };
  nodes.forEach((node) => {
    byId[node.id] = node;
  });
  return { ...nodesState, byId };
}
function removeNodes(nodesState, nodeIds) {
  const byId = { ...nodesState.byId };
  nodeIds.forEach((id) => delete byId[id]);
  return { ...nodesState, byId };
}

// frontend/ui/modules/workspace/modules/state/store.ts
var Store = class {
  state = initialState;
  subscribers = /* @__PURE__ */ new Set();
  getState() {
    return this.state;
  }
  dispatch(action) {
    this.state = rootReducer(this.state, action);
    this.subscribers.forEach((handler) => handler(this.state));
  }
  subscribe(handler) {
    this.subscribers.add(handler);
    handler(this.state);
    return () => this.subscribers.delete(handler);
  }
};
var store = new Store();

// frontend/ui/modules/workspace/modules/ui/render/renderDesktop.ts
function renderDesktop(root, state) {
  const container = root.querySelector("[data-role='nodes']");
  if (!container) return;
  const nodes = Object.values(state.nodes.byId).filter((node) => node.type !== "workspace");
  container.innerHTML = nodes.map((node) => renderNodeCard(node)).join("");
}
function renderNodeCard(node) {
  return `
    <div class="node-card" data-node-id="${node.id}" data-node-type="${node.type}" draggable="true">
      <div class="node-card-title" data-role="title">${node.title}</div>
      <div class="node-card-meta" data-role="meta">${node.meta || node.type}</div>
    </div>
  `;
}

// frontend/ui/modules/workspace/modules/ui/render/renderTree.ts
function renderTree(root, state) {
  const container = root.querySelector("[data-role='tree']");
  if (!container) return;
  const nodes = Object.values(state.nodes.byId);
  container.innerHTML = nodes.map((node) => renderTreeItem(node)).join("");
}
function renderTreeItem(node) {
  return `
    <div class="tree-item" data-node-id="${node.id}" data-node-type="${node.type}">
      ${node.title}
    </div>
  `;
}

// frontend/ui/modules/workspace/modules/ui/render/renderNotifications.ts
function renderNotifications(container, state) {
  const list = container.querySelector("[data-role='notifications']");
  if (!list) return;
  list.innerHTML = state.notifications.items.map(
    (item) => `<div class="notification-item" data-notification-id="${item.id}">${item.message}
          <button data-action="notification-read" data-notification-id="${item.id}" type="button">Read</button>
          <button data-action="notification-dismiss" data-notification-id="${item.id}" type="button">Dismiss</button>
        </div>`
  ).join("");
}

// frontend/ui/modules/workspace/modules/api/idempotency.ts
function createIdempotencyKey() {
  if (crypto && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// frontend/ui/modules/workspace/modules/api/client.ts
var ApiClient = class {
  baseUrl;
  token;
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
  }
  setToken(token) {
    this.token = token;
  }
  async request(method, path, body) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    if (["POST", "PUT", "PATCH"].includes(method)) {
      headers["X-Idempotency-Key"] = createIdempotencyKey();
    }
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : void 0
    });
    if (!response.ok) {
      throw new Error(`API ${method} ${path} failed: ${response.status}`);
    }
    return await response.json();
  }
};
var sharedClient = null;
function getApiClient(baseUrl, token) {
  if (!sharedClient) {
    sharedClient = new ApiClient({ baseUrl, token });
  }
  if (token !== void 0) {
    sharedClient.setToken(token);
  }
  return sharedClient;
}

// frontend/ui/modules/workspace/modules/api/endpoints.ts
var WorkspaceApi = class {
  constructor(client) {
    this.client = client;
  }
  getWorkspace(id) {
    return this.client.request("GET", `/workspaces/${id}`);
  }
  createWorkspace(payload) {
    return this.client.request("POST", "/workspaces", payload);
  }
  createFolder(payload) {
    return this.client.request("POST", "/folders", payload);
  }
  createStudy(payload) {
    return this.client.request("POST", "/studies", payload);
  }
  moveNode(payload) {
    return this.client.request("POST", "/nodes/move", payload);
  }
  copyNode(payload) {
    return this.client.request("POST", "/nodes/copy", payload);
  }
  deleteNode(nodeId) {
    return this.client.request("DELETE", `/nodes/${nodeId}`);
  }
  renameNode(type, id, payload) {
    return this.client.request("PUT", `/${type}/${id}`, payload);
  }
};
var StudyApi = class {
  constructor(client) {
    this.client = client;
  }
  getStudy(id) {
    return this.client.request("GET", `/studies/${id}`);
  }
  getChapters(id) {
    return this.client.request("GET", `/studies/${id}/chapters`);
  }
  importPgn(id, payload) {
    return this.client.request("POST", `/studies/${id}/import-pgn`, payload);
  }
  exportStudy(id, payload) {
    return this.client.request("POST", `/studies/${id}/export`, payload);
  }
  getExportJob(jobId) {
    return this.client.request("GET", `/export-jobs/${jobId}`);
  }
  addMove(payload) {
    return this.client.request("POST", "/study/move", payload);
  }
  deleteMove(payload) {
    return this.client.request("POST", "/study/move/delete", payload);
  }
  updateAnnotation(payload) {
    return this.client.request("POST", "/study/move/annotation", payload);
  }
  promoteVariation(payload) {
    return this.client.request("POST", "/study/variation/promote", payload);
  }
  reorderVariation(payload) {
    return this.client.request("POST", "/study/variation/reorder", payload);
  }
  getVersions(studyId) {
    return this.client.request("GET", `/studies/${studyId}/versions`);
  }
  getVersionDiff(studyId, version) {
    return this.client.request("GET", `/studies/${studyId}/versions/${version}/diff`);
  }
  rollback(studyId, payload) {
    return this.client.request("POST", `/studies/${studyId}/rollback`, payload);
  }
};
var DiscussionApi = class {
  constructor(client) {
    this.client = client;
  }
  listDiscussions(targetId) {
    return this.client.request("GET", `/discussions?target=${encodeURIComponent(targetId)}`);
  }
  createThread(payload) {
    return this.client.request("POST", "/discussions", payload);
  }
  addReply(threadId, payload) {
    return this.client.request("POST", `/discussions/${threadId}/replies`, payload);
  }
  editReply(replyId, payload) {
    return this.client.request("PUT", `/discussions/replies/${replyId}`, payload);
  }
  deleteReply(replyId) {
    return this.client.request("DELETE", `/discussions/replies/${replyId}`);
  }
  updateThread(threadId, payload) {
    return this.client.request("PUT", `/discussions/${threadId}`, payload);
  }
  deleteThread(threadId) {
    return this.client.request("DELETE", `/discussions/${threadId}`);
  }
  resolveThread(threadId) {
    return this.client.request("POST", `/discussions/${threadId}/resolve`);
  }
  pinThread(threadId) {
    return this.client.request("POST", `/discussions/${threadId}/pin`);
  }
};
var UserApi = class {
  constructor(client) {
    this.client = client;
  }
  search(query) {
    return this.client.request("GET", `/users?q=${encodeURIComponent(query)}`);
  }
};
var NotificationApi = class {
  constructor(client) {
    this.client = client;
  }
  list() {
    return this.client.request("GET", "/notifications");
  }
  markRead(id) {
    return this.client.request("POST", `/notifications/${id}/read`);
  }
  bulkRead() {
    return this.client.request("POST", "/notifications/bulk-read");
  }
  dismiss(id) {
    return this.client.request("POST", `/notifications/${id}/dismiss`);
  }
  updatePreferences(payload) {
    return this.client.request("PUT", "/notifications/preferences", payload);
  }
};
var PresenceApi = class {
  constructor(client) {
    this.client = client;
  }
  heartbeat(payload) {
    return this.client.request("POST", "/presence/heartbeat", payload);
  }
  list(studyId) {
    return this.client.request("GET", `/presence/${studyId}`);
  }
};

// frontend/ui/modules/workspace/modules/features/notifications/notifications.controller.ts
function createNotificationsController(baseUrl) {
  const api = new NotificationApi(getApiClient(baseUrl, store.getState().session.token));
  return {
    async load() {
      const items = await api.list();
      const unreadCount = items.filter((item) => !item.read).length;
      store.dispatch({ type: "NOTIFICATIONS_SET", payload: { items, unreadCount } });
    },
    async markRead(id) {
      await api.markRead(id);
    },
    async bulkRead() {
      await api.bulkRead();
    },
    async dismiss(id) {
      await api.dismiss(id);
    },
    async updatePreferences(payload) {
      await api.updatePreferences(payload);
    }
  };
}

// frontend/ui/modules/workspace/modules/ui/render/renderWorkspace.ts
async function renderWorkspace(root, state) {
  const page = root.querySelector("[data-page='workspace']");
  if (!page) return;
  const toolbarSlot = page.querySelector("[data-slot='toolbar']");
  if (toolbarSlot && !toolbarSlot.dataset.mounted) {
    toolbarSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/Toolbar.html");
    toolbarSlot.dataset.mounted = "true";
  }
  const desktopSlot = page.querySelector("[data-slot='desktop']");
  const treeSlot = page.querySelector("[data-slot='tree']");
  if (desktopSlot && !desktopSlot.dataset.mounted) {
    desktopSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/DesktopCanvas.html");
    desktopSlot.dataset.mounted = "true";
  }
  if (treeSlot && !treeSlot.dataset.mounted) {
    treeSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/TreeView.html");
    treeSlot.dataset.mounted = "true";
  }
  desktopSlot.style.display = state.ui.viewMode === "desktop" ? "block" : "none";
  treeSlot.style.display = state.ui.viewMode === "tree" ? "block" : "none";
  renderDesktop(root, state);
  renderTree(root, state);
  const rightContent = root.querySelector("[data-component='rightpanel'] [data-role='content']");
  if (rightContent) {
    if (state.ui.rightPanelTab === "notifications") {
      rightContent.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelNotifications.html");
      const controller = createNotificationsController(window.location.origin);
      controller.load();
      renderNotifications(rightContent, state);
    } else if (state.ui.rightPanelTab === "presence") {
      rightContent.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelPresence.html");
    } else if (state.ui.rightPanelTab === "versions") {
      rightContent.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelVersions.html");
    } else {
      rightContent.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelDiscussions.html");
    }
  }
  const overlay = root.querySelector("[data-slot='overlay']");
  if (overlay) {
    overlay.dataset.open = state.ui.dialogs.shareOpen || state.ui.dialogs.importOpen || state.ui.dialogs.exportOpen ? "true" : "false";
    overlay.innerHTML = "";
    if (state.ui.dialogs.shareOpen) {
      overlay.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/DialogShare.html");
    } else if (state.ui.dialogs.importOpen) {
      overlay.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/DialogImport.html");
    } else if (state.ui.dialogs.exportOpen) {
      overlay.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/DialogExport.html");
    }
  }
  const toast = root.querySelector("[data-slot='toast']");
  if (toast) {
    toast.textContent = state.ui.toast.message || "";
  }
}

// frontend/ui/modules/workspace/modules/ui/render/renderDiscussions.ts
function renderDiscussions(container, state) {
  const list = container.querySelector("[data-role='discussions']");
  if (!list) return;
  const active = state.studies.active.studyId;
  const threads = active ? state.discussions.threadsByTargetId[active] || [] : [];
  list.innerHTML = threads.map(
    (thread) => `
      <div class="discussion-item" data-thread-id="${thread.id}">
        <div class="discussion-title">${thread.title}</div>
        <div class="discussion-actions">
          <button data-action="discussion-resolve" data-thread-id="${thread.id}" type="button">Resolve</button>
          <button data-action="discussion-pin" data-thread-id="${thread.id}" type="button">Pin</button>
          <button data-action="discussion-delete" data-thread-id="${thread.id}" type="button">Delete</button>
        </div>
        <textarea data-role="reply-content" placeholder="Reply"></textarea>
        <button data-action="discussion-reply" data-thread-id="${thread.id}" type="button">Reply</button>
      </div>
    `
  ).join("");
}

// frontend/ui/modules/workspace/modules/ui/render/renderVersions.ts
function renderVersions(container, state) {
  const list = container.querySelector("[data-role='versions']");
  if (!list) return;
  const active = state.studies.active.studyId;
  const versions = active ? state.studies.versionsByStudy[active] || [] : [];
  list.innerHTML = versions.map(
    (version) => `<div class="version-item" data-version="${version.version}">v${version.version} ${version.summary || ""}</div>`
  ).join("");
}

// frontend/ui/modules/workspace/modules/features/discussions/discussions.mentions.ts
function extractMentions(content) {
  const matches = content.match(/@([a-zA-Z0-9_]+)/g) || [];
  return matches.map((mention) => mention.slice(1));
}
function matchMentionQuery(content) {
  const match = content.match(/@([a-zA-Z0-9_]+)$/);
  return match ? match[1] : null;
}

// frontend/ui/modules/workspace/modules/features/discussions/discussions.controller.ts
function createDiscussionsController(baseUrl) {
  const api = new DiscussionApi(getApiClient(baseUrl, store.getState().session.token));
  return {
    async load(targetId) {
      const threads = await api.listDiscussions(targetId);
      store.dispatch({ type: "DISCUSSIONS_SET", payload: { threadsByTargetId: { [targetId]: threads } } });
    },
    async createThread(targetId, title, content) {
      const mentions = extractMentions(content);
      await api.createThread({ target_id: targetId, title, content, mentions });
    },
    async addReply(threadId, content) {
      await api.addReply(threadId, { content });
    },
    async updateThread(threadId, title) {
      await api.updateThread(threadId, { title });
    },
    async deleteThread(threadId) {
      await api.deleteThread(threadId);
    },
    async resolveThread(threadId) {
      await api.resolveThread(threadId);
    },
    async pinThread(threadId) {
      await api.pinThread(threadId);
    }
  };
}

// frontend/ui/modules/workspace/modules/features/study/study.versions.ts
function createVersionsController(baseUrl) {
  const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));
  return {
    async loadVersions(studyId) {
      const versions = await api.getVersions(studyId);
      store.dispatch({ type: "STUDY_SET_VERSIONS", payload: { [studyId]: versions } });
    },
    async rollback(studyId, version) {
      await api.rollback(studyId, { version });
    }
  };
}

// frontend/ui/modules/workspace/modules/ui/render/renderStudy.ts
async function renderStudy(root, state) {
  const page = root.querySelector("[data-page='study']");
  if (!page) return;
  const toolbarSlot = page.querySelector("[data-slot='toolbar']");
  if (toolbarSlot && !toolbarSlot.dataset.mounted) {
    toolbarSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/Toolbar.html");
    toolbarSlot.dataset.mounted = "true";
  }
  const chaptersSlot = page.querySelector("[data-slot='study-chapters']");
  const activeStudy = state.studies.active.studyId;
  const chapters = activeStudy ? state.studies.chaptersByStudy[activeStudy] || [] : [];
  chaptersSlot.innerHTML = chapters.map((chapter) => `<div class="chapter-item" data-chapter-id="${chapter.id}">${chapter.title}</div>`).join("");
  const right = page.querySelector("[data-slot='study-right']");
  if (state.ui.rightPanelTab === "discussions") {
    right.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelDiscussions.html");
    if (activeStudy) {
      const controller = createDiscussionsController(window.location.origin);
      controller.load(activeStudy);
    }
    renderDiscussions(right, state);
  } else if (state.ui.rightPanelTab === "versions") {
    right.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelVersions.html");
    if (activeStudy) {
      const controller = createVersionsController(window.location.origin);
      controller.loadVersions(activeStudy);
    }
    renderVersions(right, state);
  } else if (state.ui.rightPanelTab === "presence") {
    right.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelPresence.html");
    const list = right.querySelector("[data-role='presence']");
    if (list && activeStudy) {
      const presence = state.presence.byStudyId[activeStudy]?.users || [];
      list.innerHTML = presence.map((user) => `<div class="presence-item">${user.userId} (${user.status})</div>`).join("");
    }
  } else {
    right.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/PanelNotifications.html");
    renderNotifications(right, state);
  }
}

// frontend/ui/modules/workspace/modules/realtime/eventEnvelope.ts
function normalizeEnvelope(data) {
  const target = data.target || {
    id: data.target_id,
    type: data.target_type ?? null
  };
  return {
    event_id: data.event_id || data.id,
    event_type: data.event_type || data.type,
    actor_id: data.actor_id,
    target,
    target_id: data.target_id,
    target_type: data.target_type ?? null,
    payload: data.payload || {},
    timestamp: data.timestamp,
    version: data.version || 1
  };
}

// frontend/ui/modules/workspace/modules/realtime/eventRouter.ts
var handledIds = /* @__PURE__ */ new Set();
var handledQueue = [];
var MAX_HANDLED = 5e3;
function rememberEvent(id) {
  if (handledIds.has(id)) {
    return false;
  }
  handledIds.add(id);
  handledQueue.push(id);
  if (handledQueue.length > MAX_HANDLED) {
    const removed = handledQueue.shift();
    if (removed) {
      handledIds.delete(removed);
    }
  }
  return true;
}
function dispatch(action) {
  store.dispatch(action);
}
function upsertNode(node) {
  dispatch({ type: "NODES_UPSERT", payload: [node] });
  if (node.parentId !== void 0) {
    const parentKey = node.parentId ?? "root";
    const current = store.getState().nodes.childrenByParent[parentKey] || [];
    if (!current.includes(node.id)) {
      dispatch({ type: "NODES_SET_CHILDREN", payload: { [parentKey]: [...current, node.id] } });
    }
  }
}
function removeNode(id) {
  dispatch({ type: "NODES_REMOVE", payload: [id] });
}
function updatePresence(studyId, user) {
  const state = store.getState();
  const existing = state.presence.byStudyId[studyId] || { users: [], cursors: {} };
  const users = existing.users.filter((u) => u.userId !== user.userId).concat(user);
  dispatch({
    type: "PRESENCE_SET",
    payload: { byStudyId: { ...state.presence.byStudyId, [studyId]: { users, cursors: existing.cursors } } }
  });
}
function routeEvent(raw) {
  const event = normalizeEnvelope(raw);
  if (!event.event_id || !rememberEvent(event.event_id)) {
    return;
  }
  const targetId = event.target?.id || event.target_id;
  const payload = event.payload || {};
  switch (event.event_type) {
    case "workspace.created":
    case "folder.created":
    case "study.created": {
      if (!targetId) return;
      const node = {
        id: targetId,
        type: event.event_type.startsWith("workspace") ? "workspace" : event.event_type.startsWith("folder") ? "folder" : "study",
        title: payload.title || "Untitled",
        parentId: payload.parent_id || null,
        meta: payload.meta
      };
      upsertNode(node);
      break;
    }
    case "folder.renamed":
    case "workspace.updated":
    case "study.updated": {
      if (!targetId) return;
      const existing = store.getState().nodes.byId[targetId];
      if (!existing) return;
      upsertNode({ ...existing, title: payload.title || existing.title });
      break;
    }
    case "workspace.moved":
    case "folder.moved":
    case "study.moved": {
      if (!targetId) return;
      const existing = store.getState().nodes.byId[targetId];
      if (!existing) return;
      upsertNode({ ...existing, parentId: payload.new_parent_id || null });
      break;
    }
    case "workspace.deleted":
    case "folder.deleted":
    case "study.deleted":
    case "node.soft_deleted":
    case "node.permanently_deleted": {
      if (!targetId) return;
      removeNode(targetId);
      break;
    }
    case "layout.updated": {
      if (!payload.layout) return;
      dispatch({ type: "NODES_SET_LAYOUT", payload: payload.layout });
      break;
    }
    case "acl.shared":
    case "acl.revoked":
    case "acl.role_changed":
    case "acl.link_created":
    case "acl.link_revoked":
    case "acl.inherited":
    case "acl.inheritance_broken": {
      if (!targetId) return;
      dispatch({ type: "ACL_SET", payload: { [targetId]: payload.role || payload.permission || "viewer" } });
      break;
    }
    case "presence.user_joined":
    case "presence.user_left":
    case "presence.user_active":
    case "presence.user_idle":
    case "presence.user_away":
    case "presence.cursor_moved": {
      if (!targetId) return;
      const user = {
        userId: payload.user_id || event.actor_id,
        status: payload.new_status || payload.status || "active",
        chapterId: payload.chapter_id,
        movePath: payload.move_path
      };
      updatePresence(targetId, user);
      break;
    }
    case "notification.created": {
      const items = store.getState().notifications.items;
      dispatch({
        type: "NOTIFICATIONS_SET",
        payload: { items: [{ id: event.event_id, message: payload.message || event.event_type, read: false }, ...items] }
      });
      break;
    }
    default:
      break;
  }
}

// frontend/ui/modules/workspace/modules/realtime/ws.ts
var WorkspaceSocket = class {
  url;
  socket = null;
  status = "disconnected";
  retries = 0;
  maxRetries = 5;
  listeners = /* @__PURE__ */ new Set();
  constructor(url) {
    this.url = url;
  }
  connect() {
    if (this.socket && this.status === "connected") {
      return;
    }
    this.setStatus("connecting");
    this.socket = new WebSocket(this.url);
    this.socket.onopen = () => {
      this.retries = 0;
      this.setStatus("connected");
    };
    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        routeEvent(payload);
      } catch (error) {
        console.warn("WS message parse failed", error);
      }
    };
    this.socket.onclose = () => {
      this.setStatus("disconnected");
      this.retry();
    };
    this.socket.onerror = () => {
      this.setStatus("error");
    };
  }
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.setStatus("disconnected");
    }
  }
  subscribe(handler) {
    this.listeners.add(handler);
    handler(this.status);
    return () => this.listeners.delete(handler);
  }
  sendJson(payload) {
    if (this.socket && this.status === "connected") {
      this.socket.send(JSON.stringify(payload));
    }
  }
  setStatus(status) {
    this.status = status;
    this.listeners.forEach((handler) => handler(status));
  }
  retry() {
    if (this.retries >= this.maxRetries) {
      return;
    }
    const delay = Math.min(1e3 * Math.pow(2, this.retries), 1e4);
    this.retries += 1;
    setTimeout(() => this.connect(), delay);
  }
};

// frontend/ui/modules/workspace/modules/realtime/subscriptions.ts
function createWorkspaceSocket(baseUrl, workspaceId) {
  const url = `${baseUrl.replace("http", "ws")}/events?scope=workspace:${workspaceId}`;
  return new WorkspaceSocket(url);
}
function createPresenceSocket(baseUrl, studyId) {
  const url = `${baseUrl.replace("http", "ws")}/ws/presence?study_id=${studyId}`;
  return new WorkspaceSocket(url);
}

// frontend/ui/modules/workspace/modules/bootstrap/router.ts
function parseRoute(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "studies" && parts[1]) {
    return { page: "study", id: parts[1] };
  }
  if (parts[0] === "workspaces" && parts[1]) {
    return { page: "workspace", id: parts[1] };
  }
  return { page: "workspace" };
}
function initRouter(root) {
  const mainSlot = root.querySelector("[data-slot='main']");
  let socket = null;
  const renderRoute = async () => {
    const route = parseRoute(window.location.pathname);
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    if (route.page === "study") {
      mainSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/StudyPage.html");
      store.dispatch({ type: "STUDY_SET_ACTIVE", payload: { studyId: route.id, chapterId: null } });
      renderStudy(root, store.getState());
      if (route.id) {
        socket = createPresenceSocket(window.location.origin, route.id);
        socket.connect();
        window.__presenceSocket = socket;
      }
      return;
    }
    mainSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/WorkspacePage.html");
    renderWorkspace(root, store.getState());
    if (route.id) {
      socket = createWorkspaceSocket(window.location.origin, route.id);
      socket.connect();
    }
  };
  window.addEventListener("popstate", renderRoute);
  renderRoute();
}

// frontend/ui/modules/workspace/modules/ui/bindings/bindTopNav.ts
function bindTopNav(root) {
  const themeBtn = root.querySelector("[data-role='theme-toggle']");
  const paletteSelect = root.querySelector("[data-role='palette-select']");
  const unreadBadge = root.querySelector("[data-role='unread']");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = store.getState().ui.theme.theme;
      const next = current === "light" ? "dark" : "light";
      store.dispatch({ type: "UI_SET_THEME", payload: { ...store.getState().ui.theme, theme: next } });
    });
  }
  if (paletteSelect) {
    paletteSelect.addEventListener("change", () => {
      store.dispatch({
        type: "UI_SET_THEME",
        payload: { ...store.getState().ui.theme, palette: paletteSelect.value }
      });
    });
  }
  store.subscribe((state) => {
    try {
      localStorage.setItem("workspace-theme", JSON.stringify(state.ui.theme));
    } catch {
      return;
    }
    if (unreadBadge) {
      unreadBadge.textContent = String(state.notifications.unreadCount || 0);
    }
  });
}

// frontend/ui/modules/workspace/modules/features/nodes/nodes.controller.ts
function buildChildrenIndex(nodes) {
  const childrenByParent = {};
  nodes.forEach((node) => {
    const key = node.parentId || "root";
    if (!childrenByParent[key]) {
      childrenByParent[key] = [];
    }
    childrenByParent[key].push(node.id);
  });
  return childrenByParent;
}
function createNodesController(baseUrl) {
  const api = new WorkspaceApi(getApiClient(baseUrl, store.getState().session.token));
  return {
    async loadWorkspace(workspaceId) {
      const response = await api.getWorkspace(workspaceId);
      const nodes = response.nodes || [];
      store.dispatch({ type: "NODES_UPSERT", payload: nodes });
      store.dispatch({ type: "NODES_SET_CHILDREN", payload: buildChildrenIndex(nodes) });
    },
    async createWorkspace(title) {
      await api.createWorkspace({ title });
    },
    async createFolder(parentId, title) {
      await api.createFolder({ parent_id: parentId, title });
    },
    async createStudy(parentId, title) {
      await api.createStudy({ parent_id: parentId, title });
    },
    async renameNode(type, id, title) {
      await api.renameNode(type, id, { title });
    },
    async deleteNode(id) {
      await api.deleteNode(id);
    },
    async moveNode(nodeId, newParentId) {
      await api.moveNode({ node_id: nodeId, new_parent_id: newParentId });
    },
    async copyNode(nodeId, newParentId) {
      await api.copyNode({ node_id: nodeId, new_parent_id: newParentId });
    }
  };
}

// frontend/ui/modules/workspace/modules/ui/bindings/bindToolbar.ts
function bindToolbar(root) {
  const baseUrl = window.location.origin;
  const controller = createNodesController(baseUrl);
  root.addEventListener("click", async (event) => {
    const target = event.target;
    const action = target?.dataset?.action;
    if (!action) return;
    if (action === "new-workspace") {
      const title = window.prompt("Workspace name", "New Workspace");
      if (title) await controller.createWorkspace(title);
    }
    if (action === "new-folder") {
      const title = window.prompt("Folder name", "New Folder");
      if (title) await controller.createFolder(null, title);
    }
    if (action === "new-study") {
      const title = window.prompt("Study name", "New Study");
      if (title) await controller.createStudy(null, title);
    }
    if (action === "view-toggle") {
      const viewMode = store.getState().ui.viewMode === "desktop" ? "tree" : "desktop";
      store.dispatch({ type: "UI_SET_VIEW_MODE", payload: viewMode });
    }
    if (action === "share") {
      store.dispatch({ type: "UI_SET_DIALOGS", payload: { shareOpen: true } });
    }
    if (action === "import") {
      store.dispatch({ type: "UI_SET_DIALOGS", payload: { importOpen: true } });
    }
    if (action === "export") {
      store.dispatch({ type: "UI_SET_DIALOGS", payload: { exportOpen: true } });
    }
    if (action === "dialog-close") {
      store.dispatch({
        type: "UI_SET_DIALOGS",
        payload: { shareOpen: false, importOpen: false, exportOpen: false, confirmOpen: false }
      });
    }
  });
}

// frontend/ui/modules/workspace/modules/ui/bindings/bindSidebar.ts
function bindSidebar(root) {
  const sidebar = root.querySelector("[data-component='leftsidebar']");
  if (!sidebar) return;
  sidebar.addEventListener("click", (event) => {
    const target = event.target;
    if (!target?.dataset?.tab) return;
    const content = sidebar.querySelector("[data-role='content']");
    if (!content) return;
    content.textContent = `Tab: ${target.dataset.tab}`;
  });
}

// frontend/ui/modules/workspace/modules/features/nodes/nodes.dragdrop.ts
function bindDragDrop(root, baseUrl) {
  const controller = createNodesController(baseUrl);
  root.addEventListener("dragstart", (event) => {
    const target = event.target;
    if (!target || !target.dataset.nodeId) return;
    event.dataTransfer?.setData("text/plain", target.dataset.nodeId);
  });
  root.addEventListener("dragover", (event) => {
    const target = event.target;
    if (target && (target.closest("[data-role='nodes']") || target.closest("[data-role='tree']"))) {
      event.preventDefault();
    }
  });
  root.addEventListener("drop", async (event) => {
    const target = event.target;
    const container = target?.closest("[data-role='nodes']") || target?.closest("[data-role='tree']");
    if (!container) return;
    event.preventDefault();
    const nodeId = event.dataTransfer?.getData("text/plain");
    if (!nodeId) return;
    await controller.moveNode(nodeId, null);
  });
}

// frontend/ui/modules/workspace/modules/features/nodes/nodes.contextmenu.ts
function bindContextMenu(root, baseUrl) {
  const controller = createNodesController(baseUrl);
  root.addEventListener("contextmenu", async (event) => {
    const target = event.target.closest("[data-node-id]");
    if (!target) return;
    event.preventDefault();
    const action = window.prompt("Action: rename/delete/copy", "rename");
    if (!action) return;
    const nodeId = target.dataset.nodeId;
    const nodeType = target.dataset.nodeType;
    if (action === "rename") {
      const title = window.prompt("New name", "Untitled");
      if (!title) return;
      const typeMap = {
        workspace: "workspaces",
        folder: "folders",
        study: "studies"
      };
      await controller.renameNode(typeMap[nodeType], nodeId, title);
    }
    if (action === "delete") {
      await controller.deleteNode(nodeId);
    }
    if (action === "copy") {
      await controller.copyNode(nodeId, null);
    }
  });
}

// frontend/ui/modules/workspace/modules/ui/bindings/bindDesktop.ts
function bindDesktop(root) {
  const baseUrl = window.location.origin;
  bindDragDrop(root, baseUrl);
  bindContextMenu(root, baseUrl);
}

// frontend/ui/modules/workspace/modules/features/study/study.chapters.ts
function bindChapters(root) {
  const container = root.querySelector("[data-slot='study-chapters']");
  if (!container) return;
  container.addEventListener("click", (event) => {
    const target = event.target.closest("[data-chapter-id]");
    if (!target) return;
    const chapterId = target.dataset.chapterId;
    store.dispatch({ type: "STUDY_SET_ACTIVE", payload: { chapterId } });
  });
}

// frontend/ui/modules/workspace/modules/features/study/study.editor.ts
function bindStudyEditor(root, baseUrl) {
  const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));
  const moveList = root.querySelector("[data-slot='study-movelist']");
  if (!moveList) return;
  moveList.addEventListener("click", async (event) => {
    const active = store.getState().studies.active;
    if (!active.studyId) return;
    if (event.shiftKey) {
      await api.promoteVariation({ study_id: active.studyId, path: "main.1" });
    } else {
      await api.addMove({ study_id: active.studyId, move: "e4", path: "main.1" });
    }
    const presenceSocket = window.__presenceSocket;
    if (presenceSocket) {
      presenceSocket.sendJson({
        type: "presence.cursor_moved",
        data: { study_id: active.studyId, chapter_id: active.chapterId, move_path: "main.1" }
      });
    }
  });
  moveList.addEventListener("contextmenu", async (event) => {
    event.preventDefault();
    const active = store.getState().studies.active;
    if (!active.studyId) return;
    await api.deleteMove({ study_id: active.studyId, path: "main.1" });
  });
}

// frontend/ui/modules/workspace/modules/features/study/study.import.ts
function bindStudyImport(root, baseUrl) {
  const overlay = root.querySelector("[data-slot='overlay']");
  if (!overlay) return;
  overlay.addEventListener("click", async (event) => {
    const target = event.target;
    if (target?.dataset?.action !== "import-confirm") return;
    const active = store.getState().studies.active;
    if (!active.studyId) return;
    const textarea = overlay.querySelector("[data-dialog='import'] textarea[data-field='pgn']");
    const pgn = textarea?.value || "";
    const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));
    await api.importPgn(active.studyId, { pgn });
    store.dispatch({ type: "UI_SET_DIALOGS", payload: { importOpen: false } });
  });
}

// frontend/ui/modules/workspace/modules/features/study/study.export.ts
function bindStudyExport(root, baseUrl) {
  const overlay = root.querySelector("[data-slot='overlay']");
  if (!overlay) return;
  overlay.addEventListener("click", async (event) => {
    const target = event.target;
    if (!target?.dataset?.action) return;
    const active = store.getState().studies.active;
    if (!active.studyId) return;
    const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));
    const format = target.dataset.action === "export-pgn" ? "pgn" : "zip";
    if (format) {
      const job = await api.exportStudy(active.studyId, { format });
      store.dispatch({ type: "JOBS_SET", payload: { exportById: { [job.id]: job } } });
      pollExportJob(api, job.id);
    }
  });
}
async function pollExportJob(api, jobId) {
  const interval = window.setInterval(async () => {
    const job = await api.getExportJob(jobId);
    store.dispatch({ type: "JOBS_SET", payload: { exportById: { [jobId]: job } } });
    if (job.status === "completed") {
      store.dispatch({ type: "UI_SET_TOAST", payload: "Export completed" });
      window.clearInterval(interval);
    }
    if (job.status === "failed") {
      store.dispatch({ type: "UI_SET_TOAST", payload: "Export failed" });
      window.clearInterval(interval);
    }
  }, 3e3);
}

// frontend/ui/modules/workspace/modules/features/study/study.annotations.ts
function bindAnnotations(root, baseUrl) {
  const panel = root.querySelector("[data-slot='study-right']");
  if (!panel) return;
  const textarea = panel.querySelector("textarea[data-role='annotation']");
  if (!textarea) return;
  textarea.addEventListener("change", async () => {
    const active = store.getState().studies.active;
    if (!active.studyId || !active.chapterId) return;
    const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));
    await api.updateAnnotation({ study_id: active.studyId, path: active.chapterId, content: textarea.value });
  });
}

// frontend/ui/modules/workspace/modules/features/presence/presence.controller.ts
function createPresenceController(baseUrl) {
  const api = new PresenceApi(getApiClient(baseUrl, store.getState().session.token));
  return {
    async heartbeat(studyId, chapterId, movePath) {
      await api.heartbeat({ study_id: studyId, chapter_id: chapterId, move_path: movePath });
    },
    async list(studyId) {
      const response = await api.list(studyId);
      store.dispatch({ type: "PRESENCE_SET", payload: { byStudyId: { [studyId]: response } } });
    }
  };
}

// frontend/ui/modules/workspace/modules/features/presence/presence.heartbeat.ts
function startHeartbeat(baseUrl) {
  const controller = createPresenceController(baseUrl);
  const interval = window.setInterval(async () => {
    const active = store.getState().studies.active;
    if (!active.studyId) return;
    await controller.heartbeat(active.studyId, active.chapterId, null);
  }, 3e4);
  return () => window.clearInterval(interval);
}

// frontend/ui/modules/workspace/modules/ui/bindings/bindStudy.ts
function bindStudy(root) {
  const baseUrl = window.location.origin;
  bindChapters(root);
  bindStudyEditor(root, baseUrl);
  bindStudyImport(root, baseUrl);
  bindStudyExport(root, baseUrl);
  bindAnnotations(root, baseUrl);
  startHeartbeat(baseUrl);
  const rightPanel = root.querySelector("[data-component='rightpanel']");
  if (rightPanel) {
    rightPanel.addEventListener("click", (event) => {
      const target = event.target;
      const tab = target?.dataset?.tab;
      if (!tab) return;
      store.dispatch({ type: "UI_SET_RIGHT_TAB", payload: tab });
    });
  }
  root.addEventListener("click", async (event) => {
    const target = event.target;
    if (target?.dataset?.action !== "discussion-create") return;
    const active = store.getState().studies.active.studyId;
    if (!active) return;
    const panel = root.querySelector("[data-component='panel-discussions']");
    const title = panel?.querySelector("[data-role='discussion-title']");
    const content = panel?.querySelector("[data-role='discussion-content']");
    if (!title || !content) return;
    const controller = createDiscussionsController(baseUrl);
    await controller.createThread(active, title.value, content.value);
    title.value = "";
    content.value = "";
  });
  root.addEventListener("click", async (event) => {
    const target = event.target;
    if (target?.dataset?.action !== "version-rollback") return;
    const active = store.getState().studies.active.studyId;
    if (!active) return;
    const versionId = Number(target.dataset.version);
    if (!versionId) return;
    const controller = createVersionsController(baseUrl);
    await controller.rollback(active, versionId);
  });
  root.addEventListener("click", async (event) => {
    const target = event.target;
    if (!target?.dataset?.action?.startsWith("nag-")) return;
    const active = store.getState().studies.active;
    if (!active.studyId || !active.chapterId) return;
    const nag = target.dataset.action.replace("nag-", "");
    const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));
    await api.updateAnnotation({ study_id: active.studyId, path: active.chapterId, content: "", nag });
  });
  root.addEventListener("click", async (event) => {
    const target = event.target;
    if (!target?.dataset?.action) return;
    const controller = createDiscussionsController(baseUrl);
    if (target.dataset.action === "discussion-reply") {
      const threadId = target.dataset.threadId;
      const container = target.closest("[data-thread-id]");
      const reply = container?.querySelector("[data-role='reply-content']");
      if (threadId && reply?.value) {
        await controller.addReply(threadId, reply.value);
        reply.value = "";
      }
    }
    if (target.dataset.action === "discussion-resolve") {
      const threadId = target.dataset.threadId;
      if (threadId) await controller.resolveThread(threadId);
    }
    if (target.dataset.action === "discussion-pin") {
      const threadId = target.dataset.threadId;
      if (threadId) await controller.pinThread(threadId);
    }
    if (target.dataset.action === "discussion-delete") {
      const threadId = target.dataset.threadId;
      if (threadId) await controller.deleteThread(threadId);
    }
  });
  root.addEventListener("click", async (event) => {
    const target = event.target;
    if (target?.dataset?.action !== "preferences-save") return;
    const panel = root.querySelector("[data-component='panel-notifications']");
    const prefs = panel?.querySelectorAll("[data-pref]") || [];
    const payload = {};
    prefs.forEach((pref) => {
      const input = pref;
      payload[input.dataset.pref || ""] = input.checked;
    });
    const controller = createNotificationsController(baseUrl);
    await controller.updatePreferences(payload);
  });
  root.addEventListener("click", async (event) => {
    const target = event.target;
    if (!target?.dataset?.action) return;
    const controller = createNotificationsController(baseUrl);
    if (target.dataset.action === "notifications-bulk-read") {
      await controller.bulkRead();
    }
    if (target.dataset.action === "notification-read") {
      const id = target.dataset.notificationId;
      if (id) await controller.markRead(id);
    }
    if (target.dataset.action === "notification-dismiss") {
      const id = target.dataset.notificationId;
      if (id) await controller.dismiss(id);
    }
  });
  root.addEventListener("input", async (event) => {
    const target = event.target;
    if (!target?.dataset?.role || target.dataset.role !== "discussion-content") return;
    const query = matchMentionQuery(target.value);
    if (!query) return;
    const api = new UserApi(getApiClient(baseUrl, store.getState().session.token));
    await api.search(query);
  });
}

// frontend/ui/modules/workspace/modules/bootstrap/mount.ts
var STYLE_PATHS = [
  "/frontend/ui/modules/workspace/styles/tokens/colors.morandi.css",
  "/frontend/ui/modules/workspace/styles/tokens/spacing.css",
  "/frontend/ui/modules/workspace/styles/tokens/radius.css",
  "/frontend/ui/modules/workspace/styles/tokens/typography.css",
  "/frontend/ui/modules/workspace/styles/tokens/shadow.css",
  "/frontend/ui/modules/workspace/styles/tokens/zindex.css",
  "/frontend/ui/modules/workspace/styles/theme/theme.base.css",
  "/frontend/ui/modules/workspace/styles/theme/theme.morandi.light.css",
  "/frontend/ui/modules/workspace/styles/theme/theme.morandi.dark.css",
  "/frontend/ui/modules/workspace/styles/theme/theme.alt.placeholder.css",
  "/frontend/ui/modules/workspace/styles/components/buttons.css",
  "/frontend/ui/modules/workspace/styles/components/inputs.css",
  "/frontend/ui/modules/workspace/styles/components/cards.css",
  "/frontend/ui/modules/workspace/styles/components/panels.css",
  "/frontend/ui/modules/workspace/styles/components/chessboard.css",
  "/frontend/ui/modules/workspace/styles/components/markdown.css",
  "/frontend/ui/modules/workspace/styles/pages/workspace.css",
  "/frontend/ui/modules/workspace/styles/pages/study.css"
];
function ensureStyles() {
  const head = document.head;
  STYLE_PATHS.forEach((path) => {
    if (document.querySelector(`link[data-workspace-style="${path}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = path;
    link.dataset.workspaceStyle = path;
    head.appendChild(link);
  });
}
function applyTheme() {
  let theme = store.getState().ui.theme;
  try {
    const stored = localStorage.getItem("workspace-theme");
    if (stored) {
      theme = JSON.parse(stored);
      store.dispatch({ type: "UI_SET_THEME", payload: theme });
    }
  } catch {
    theme = store.getState().ui.theme;
  }
  document.documentElement.dataset.theme = theme.theme;
  document.documentElement.dataset.palette = theme.palette;
}
async function mountWorkspaceApp(rootSelector = "#app") {
  ensureStyles();
  const root = document.querySelector(rootSelector) || document.body;
  const shellHtml = await loadHtml("/frontend/ui/modules/workspace/layout/AppShell.html");
  mountHtml(root, shellHtml);
  const topNavSlot = root.querySelector("[data-slot='topnav']");
  const leftSlot = root.querySelector("[data-slot='leftsidebar']");
  const rightSlot = root.querySelector("[data-slot='rightpanel']");
  topNavSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/TopNav.html");
  leftSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/LeftSidebar.html");
  rightSlot.innerHTML = await loadHtml("/frontend/ui/modules/workspace/layout/components/RightPanel.html");
  bindTopNav(root);
  bindSidebar(root);
  initRouter(root);
  applyTheme();
  store.subscribe((state) => {
    applyTheme();
    if (state.ui.viewMode) {
      renderWorkspace(root, state);
      renderStudy(root, state);
    }
  });
  bindToolbar(root);
  bindDesktop(root);
  bindStudy(root);
}

// frontend/ui/modules/workspace/modules/bootstrap/entry.ts
window.addEventListener("DOMContentLoaded", () => {
  mountWorkspaceApp("#app");
});
