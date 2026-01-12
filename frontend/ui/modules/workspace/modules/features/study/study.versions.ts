import { getApiClient } from "../../api/client.js";
import { StudyApi } from "../../api/endpoints.js";
import { store } from "../../state/store.js";

export function createVersionsController(baseUrl: string) {
  const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));

  return {
    async loadVersions(studyId: string) {
      const versions = await api.getVersions(studyId);
      store.dispatch({ type: "STUDY_SET_VERSIONS", payload: { [studyId]: versions } });
    },
    async rollback(studyId: string, version: number) {
      await api.rollback(studyId, { version });
    },
  };
}
