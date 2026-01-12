import type { Action, NodeItem, PresenceUser } from "../state/types.js";
import { store } from "../state/store.js";
import { normalizeEnvelope } from "./eventEnvelope.js";

const handledIds = new Set<string>();
const handledQueue: string[] = [];
const MAX_HANDLED = 5000;

function rememberEvent(id: string): boolean {
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

function dispatch(action: Action) {
  store.dispatch(action);
}

function upsertNode(node: NodeItem) {
  dispatch({ type: "NODES_UPSERT", payload: [node] });
  if (node.parentId !== undefined) {
    const parentKey = node.parentId ?? "root";
    const current = store.getState().nodes.childrenByParent[parentKey] || [];
    if (!current.includes(node.id)) {
      dispatch({ type: "NODES_SET_CHILDREN", payload: { [parentKey]: [...current, node.id] } });
    }
  }
}

function removeNode(id: string) {
  dispatch({ type: "NODES_REMOVE", payload: [id] });
}

function updatePresence(studyId: string, user: PresenceUser) {
  const state = store.getState();
  const existing = state.presence.byStudyId[studyId] || { users: [], cursors: {} };
  const users = existing.users.filter((u) => u.userId !== user.userId).concat(user);
  dispatch({
    type: "PRESENCE_SET",
    payload: { byStudyId: { ...state.presence.byStudyId, [studyId]: { users, cursors: existing.cursors } } },
  });
}

export function routeEvent(raw: any): void {
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
      const node: NodeItem = {
        id: targetId,
        type: event.event_type.startsWith("workspace")
          ? "workspace"
          : event.event_type.startsWith("folder")
            ? "folder"
            : "study",
        title: payload.title || "Untitled",
        parentId: payload.parent_id || null,
        meta: payload.meta,
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
      const user: PresenceUser = {
        userId: payload.user_id || event.actor_id,
        status: payload.new_status || payload.status || "active",
        chapterId: payload.chapter_id,
        movePath: payload.move_path,
      };
      updatePresence(targetId, user);
      break;
    }
    case "notification.created": {
      const items = store.getState().notifications.items;
      dispatch({
        type: "NOTIFICATIONS_SET",
        payload: { items: [{ id: event.event_id, message: payload.message || event.event_type, read: false }, ...items] },
      });
      break;
    }
    default:
      break;
  }
}
