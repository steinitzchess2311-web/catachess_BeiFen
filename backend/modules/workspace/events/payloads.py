"""
Event payload schemas and helpers.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class EventEnvelope(BaseModel):
    event_id: str
    event_type: str
    actor_id: str
    target_id: str
    target_type: str | None
    timestamp: datetime
    version: int
    payload: dict[str, Any] = Field(default_factory=dict)


def build_event_envelope(
    event_id: str,
    event_type: str,
    actor_id: str,
    target_id: str,
    target_type: str | None,
    timestamp: datetime,
    version: int,
    payload: dict[str, Any] | None,
) -> dict[str, Any]:
    envelope = EventEnvelope(
        event_id=event_id,
        event_type=event_type,
        actor_id=actor_id,
        target_id=target_id,
        target_type=target_type,
        timestamp=timestamp,
        version=version,
        payload=payload or {},
    )
    return envelope.model_dump()


def extract_event_payload(event) -> dict[str, Any]:
    payload = getattr(event, "payload", None) or {}
    if isinstance(payload, dict) and "payload" in payload and "event_type" in payload:
        return payload.get("payload") or {}
    return payload
