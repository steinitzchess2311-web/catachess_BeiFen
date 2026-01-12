export interface EventTarget {
  type: string | null;
  id: string;
}

export interface EventEnvelope {
  event_id: string;
  event_type: string;
  actor_id: string;
  target?: EventTarget;
  target_id?: string;
  target_type?: string | null;
  payload: Record<string, any>;
  timestamp: string;
  version: number;
}

export function normalizeEnvelope(data: any): EventEnvelope {
  const target = data.target || {
    id: data.target_id,
    type: data.target_type ?? null,
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
    version: data.version || 1,
  };
}
