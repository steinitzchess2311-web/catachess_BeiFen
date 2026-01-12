import { getApiClient } from "../../api/client.js";
import { DiscussionApi } from "../../api/endpoints.js";
import { store } from "../../state/store.js";
import { extractMentions } from "./discussions.mentions.js";

export function createDiscussionsController(baseUrl: string) {
  const api = new DiscussionApi(getApiClient(baseUrl, store.getState().session.token));

  return {
    async load(targetId: string) {
      const threads = await api.listDiscussions(targetId);
      store.dispatch({ type: "DISCUSSIONS_SET", payload: { threadsByTargetId: { [targetId]: threads } } });
    },
    async createThread(targetId: string, title: string, content: string) {
      const mentions = extractMentions(content);
      await api.createThread({ target_id: targetId, title, content, mentions });
    },
    async addReply(threadId: string, content: string) {
      await api.addReply(threadId, { content });
    },
    async updateThread(threadId: string, title: string) {
      await api.updateThread(threadId, { title });
    },
    async deleteThread(threadId: string) {
      await api.deleteThread(threadId);
    },
    async resolveThread(threadId: string) {
      await api.resolveThread(threadId);
    },
    async pinThread(threadId: string) {
      await api.pinThread(threadId);
    },
  };
}
