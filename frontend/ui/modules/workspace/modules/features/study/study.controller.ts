import { store } from "../../state/store.js";
import { getApiClient } from "../../api/client.js";
import { StudyApi } from "../../api/endpoints.js";

export function createStudyController(baseUrl: string) {
  const api = new StudyApi(getApiClient(baseUrl, store.getState().session.token));

  return {
    async loadStudy(studyId: string) {
      const study = await api.getStudy(studyId);
      store.dispatch({ type: "STUDY_SET_ACTIVE", payload: { studyId: study.id || studyId } });
    },

    async loadChapters(studyId: string) {
      const chapters = await api.getChapters(studyId);
      store.dispatch({ type: "STUDY_SET_CHAPTERS", payload: { [studyId]: chapters } });
    },
  };
}
