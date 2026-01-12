import { store } from "../../state/store.js";
import type { NodeItem } from "../../state/types.js";
import { getApiClient } from "../../api/client.js";
import { WorkspaceApi } from "../../api/endpoints.js";

function buildChildrenIndex(nodes: NodeItem[]): Record<string, string[]> {
  const childrenByParent: Record<string, string[]> = {};
  nodes.forEach((node) => {
    const key = node.parentId || "root";
    if (!childrenByParent[key]) {
      childrenByParent[key] = [];
    }
    childrenByParent[key].push(node.id);
  });
  return childrenByParent;
}

export function createNodesController(baseUrl: string) {
  const api = new WorkspaceApi(getApiClient(baseUrl, store.getState().session.token));

  return {
    async loadWorkspace(workspaceId: string) {
      const response = await api.getWorkspace(workspaceId);
      const nodes = (response.nodes || []) as NodeItem[];
      store.dispatch({ type: "NODES_UPSERT", payload: nodes });
      store.dispatch({ type: "NODES_SET_CHILDREN", payload: buildChildrenIndex(nodes) });
    },

    async createWorkspace(title: string) {
      await api.createWorkspace({ title });
    },

    async createFolder(parentId: string | null, title: string) {
      await api.createFolder({ parent_id: parentId, title });
    },

    async createStudy(parentId: string | null, title: string) {
      await api.createStudy({ parent_id: parentId, title });
    },

    async renameNode(type: "workspaces" | "folders" | "studies", id: string, title: string) {
      await api.renameNode(type, id, { title });
    },

    async deleteNode(id: string) {
      await api.deleteNode(id);
    },

    async moveNode(nodeId: string, newParentId: string | null) {
      await api.moveNode({ node_id: nodeId, new_parent_id: newParentId });
    },

    async copyNode(nodeId: string, newParentId: string | null) {
      await api.copyNode({ node_id: nodeId, new_parent_id: newParentId });
    },
  };
}
