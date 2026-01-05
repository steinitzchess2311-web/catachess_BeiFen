Chess Teaching Platform – Backend Architecture README

A modular chess teaching backend supporting teachers, students, tactical assignments,
and external engine workers (e.g. Stockfish on Raspberry Pi).

1. Project Overview

This backend is designed around clear separation of concerns:

core/: system-level infrastructure (never contains business logic)

models/: domain data structures (ORM / schemas)

services/: all business logic and workflows

routers/: HTTP API layer (FastAPI)

frontend/: frontend application (separate concern)

data/: static datasets (tactics, teaching materials)

Golden rule
Business logic lives in services/ — nowhere else.

2. Top-Level Structure
project-root/
├── backend/
│   ├── core/
│   ├── models/
│   ├── services/
│   ├── routers/
│   └── main.py
│
├── frontend/
│   └── modules/
│
├── data/
│   └── tactics/
│
└── README.md

3. core/ – Infrastructure Layer (DO NOT PUT BUSINESS LOGIC HERE)

core/ contains cross-cutting infrastructure used by all modules.

core/
├── config.py
├── security/
├── engine/
├── db/
├── storage/
├── events/
├── errors.py
└── logging.py

3.1 core/config.py

Purpose: global configuration & environment variables

Loads .env

Exposes settings

No logic allowed

Example:

settings.ENGINE_URL
settings.DATABASE_URL
settings.DATA_ROOT

3.2 core/errors.py

Purpose: unified exception system

All services raise domain-level errors, not raw exceptions.

Examples:

NotFoundError

PermissionDenied

EngineUnavailable

Routers convert these into HTTP responses.

3.3 core/db/

Purpose: database infrastructure only

Contains:

SQLAlchemy Base

DB engine

Session factory

❌ Does NOT contain:

ORM models

CRUD logic

3.4 core/engine/

Purpose: external chess engine access (Stockfish, LC0, etc.)

Engine runs as an external service (e.g. Raspberry Pi)

Backend never embeds engine binaries

engine/
├── client.py     # EngineClient (HTTP client)
├── schemas.py    # EngineResult, PV lines
└── exceptions.py


Rule
Only EngineClient may perform HTTP calls to engine workers.

3.5 core/storage/

Purpose: access to static datasets (tactics, files, objects)

Abstracts:

Local filesystem

Future S3 / Cloudflare R2

storage/
├── base.py       # abstract interfaces
└── local.py      # local filesystem implementation


Services never read files directly.

3.6 core/events/

Purpose: decouple “something happened” from “what to do next”

Used for:

logging

triggering engine analysis

statistics

notifications

Minimal in-memory event bus (sync).

events/
├── bus.py
└── handlers.py

3.7 core/security/

Purpose: authentication & authorization

current user

role checks (teacher / student)

permission guards

Business logic never inspects raw tokens.

3.8 core/logging.py

Purpose: unified logging configuration

4. models/ – Domain Models
models/
├── user.py
├── tactic.py
├── assignment.py
└── attempt.py


Contains:

SQLAlchemy ORM models

Pydantic schemas if needed

❌ Must NOT:

Call services

Call engine

Contain business logic

5. services/ – Business Logic Layer (MOST IMPORTANT)
services/
├── tactic_service.py
├── assignment_service.py
├── grading_service.py
└── progress_service.py

Responsibilities:

Validate rules

Decide correctness

Manage workflows

Emit events

Call engine via EngineClient only

Rule
Services do not know HTTP, FastAPI, or request objects.

6. routers/ – HTTP / API Layer
routers/
├── tactics.py
├── assignments.py
└── attempts.py


Responsibilities:

Parse requests

Call services

Handle errors

Return responses

❌ No business logic
❌ No engine calls

7. data/ – Static Data (NOT CODE)
data/
└── tactics/
    ├── mate_in_1/
    │   ├── 0001.json
    │   └── 0002.json
    └── winning_material/


Tactical puzzles

Teaching datasets

Version-controlled

Read-only in production

Accessed only via core/storage.

8. Engine Integration (Raspberry Pi)

Engine worker runs on Raspberry Pi

Example address: http://192.168.40.33:8001

Backend communicates via HTTP

Flow:

service → EngineClient → Raspberry Pi → Stockfish

9. Event Flow Example
Student submits move
        ↓
GradingService
        ↓
emit("TACTIC_SOLVED")
        ↓
Event handlers:
  - log
  - trigger engine analysis
  - update stats


Services never call handlers directly.

10. Architectural Rules (NON-NEGOTIABLE)

core/ contains no business logic

services/ contain no HTTP

routers/ contain no logic

File access goes through storage

Engine access goes through EngineClient

Side-effects go through events

Breaking these rules guarantees future refactor pain.

11. Future Extensions (Planned)

Async engine queue

Multiple engine workers

Engine caching

Analytics / mistake clustering

Teacher dashboards

Current architecture is designed to support all above without rewrites.

12. Final Note

This project favors clarity and evolvability over premature abstraction.
If a file feels hard to place, it probably does not belong in core.
