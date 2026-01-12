import type { Action, AppState } from "./types.js";
import { initialState, rootReducer } from "./reducers.js";

export type StateSubscriber = (state: AppState) => void;

class Store {
  private state: AppState = initialState;
  private subscribers: Set<StateSubscriber> = new Set();

  getState(): AppState {
    return this.state;
  }

  dispatch(action: Action): void {
    this.state = rootReducer(this.state, action);
    this.subscribers.forEach((handler) => handler(this.state));
  }

  subscribe(handler: StateSubscriber): () => void {
    this.subscribers.add(handler);
    handler(this.state);
    return () => this.subscribers.delete(handler);
  }
}

export const store = new Store();
