import { getApiClient } from "../../api/client.js";
import { NotificationApi } from "../../api/endpoints.js";
import { store } from "../../state/store.js";

export function createNotificationsController(baseUrl: string) {
  const api = new NotificationApi(getApiClient(baseUrl, store.getState().session.token));

  return {
    async load() {
      const items = await api.list();
      const unreadCount = items.filter((item: any) => !item.read).length;
      store.dispatch({ type: "NOTIFICATIONS_SET", payload: { items, unreadCount } });
    },
    async markRead(id: string) {
      await api.markRead(id);
    },
    async bulkRead() {
      await api.bulkRead();
    },
    async dismiss(id: string) {
      await api.dismiss(id);
    },
    async updatePreferences(payload: Record<string, any>) {
      await api.updatePreferences(payload);
    },
  };
}
