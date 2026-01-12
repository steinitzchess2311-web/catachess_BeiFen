import { store } from "../../state/store.js";

export function openShareDialog(): void {
  store.dispatch({ type: "UI_SET_DIALOGS", payload: { shareOpen: true } });
}

export function closeShareDialog(): void {
  store.dispatch({ type: "UI_SET_DIALOGS", payload: { shareOpen: false } });
}
