# TASK-20260609-OC-DASH-28C

## Purpose

Create a design-only WhatsApp API/webhook safety pack for future sync work.

## Scope

- Threat model
- Architecture and approval gates
- Privacy and data minimization policy
- Secret handling rules
- Webhook/API checklist
- Retention and deletion requirements
- Production blockers
- Future sprint split

## Guardrails

- No WhatsApp API implementation
- No webhook route
- No QR login
- No token, cookie, session, password, or credential input
- No environment secret file reads
- No Production connection
- No mutation, restart, or deploy
- No local WhatsApp helper/import files committed

## Verification

- Run WhatsApp helper/import tests
- Run dashboard quality gates
- Run safety scan
- Run dashboard verifier
- Confirm local-only files remain untracked

## Next recommended phase

Plan Sprint 28D as webhook/API contract mock only, with no live network integration.
