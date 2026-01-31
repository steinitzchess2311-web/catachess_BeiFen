# Plan: Send signup authentication key via Resend

## 0) Goal summary
Deliver a signup verification flow that emails a one-time `{code}` via Resend, expiring 15 minutes after issuance.

## 1) Files to add (locations)
- `backend/services/resend_email_service.py`
- `backend/services/signup_verification_service.py`
- `backend/models/verification_code.py`
- `backend/alembic/versions/002_add_verification_codes.py`
- `backend/routers/auth.py`
- `backend/templates/emails/signup_code.html`
- `backend/templates/emails/signup_code.txt`

## 2) Main purpose of each file
- `backend/services/resend_email_service.py`: Resend client wrapper that sends the `{code}` email.
- `backend/services/signup_verification_service.py`: Business logic to generate, hash, store, and validate signup codes.
- `backend/models/verification_code.py`: ORM model for persisted verification codes with expiry/consumption fields.
- `backend/alembic/versions/002_add_verification_codes.py`: DB migration to create the verification table and indexes.
- `backend/routers/auth.py`: API endpoints for `/auth/verify-signup` and `/auth/resend-verification`.
- `backend/templates/emails/signup_code.html`: HTML template that embeds `{code}`.
- `backend/templates/emails/signup_code.txt`: Plain-text fallback template with `{code}`.

## 3) Implementation plan

### Phase 1: Data and configuration
- Step 1: Define the verification code schema (user_id, code_hash, expires_at, consumed_at, created_at, purpose).
  - [x] ORM model drafted in `backend/models/verification_code.py`
  - [x] Migration file added in `backend/alembic/versions/002_add_verification_codes.py`
  - [x] Index to enforce one active code per user/purpose (by user_id/purpose/consumed_at)
- Step 2: Add Resend configuration keys.
  - [x] `RESEND_API_KEY` documented in config/env
  - [x] `RESEND_FROM_EMAIL` documented in config/env
  - [ ] Optional subject/template settings documented

### Phase 2: Email delivery
- Step 3: Implement Resend email wrapper.
  - [x] `backend/services/resend_email_service.py` created
  - [x] Sends HTML + text templates with `{code}`
  - [x] Errors logged without leaking secrets or plaintext code
- Step 4: Add email templates.
  - [x] `backend/templates/emails/signup_code.html` created
  - [x] `backend/templates/emails/signup_code.txt` created

### Phase 3: Verification flow
- Step 5: Implement signup verification service.
  - [x] Generate random code (6-8 chars)
  - [x] Hash and store with 15-minute expiry
  - [x] Invalidate previous active codes on re-issue
  - [x] Validate code and mark consumed
- Step 6: Wire into signup.
  - [x] After user creation, issue code and send email
  - [x] Return standard user response + `verification_sent: true` (if desired)
- Step 7: Add `/auth/verify-signup`.
  - [x] Accept identifier + code
  - [x] Validate not expired and hash match
  - [x] Mark consumed and set user verified (if using `users.is_verified`)

### Phase 4: Quality and rollout
- Step 8: Tests.
  - [ ] Unit tests for code generation, hashing, expiry
  - [ ] Service tests for Resend wrapper (mocked)
  - [ ] API tests for verify success/failure/expired
- Step 9: Observability and rate limits.
  - [x] Structured logs for issue/send/verify
  - [ ] Rate limit re-sends per email/IP
  - [ ] Avoid user enumeration in responses
 