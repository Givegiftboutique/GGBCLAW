# OpenClaw Dashboard Roadmap

## Phase 00 - Documentation and Guardrails

- Create repository notes and safety boundaries.
- Create dashboard design, roadmap, data model, API contract, and UI spec.
- Create operational specs for agent registry, task workflow, and Markdown memory.
- Create task memory record and artifact README.

## Phase 01 - Read-only Scaffold

- Build static dashboard shell.
- Add mock-only routes for Overview, Agents, Tasks, Reviews, Logs, Backups, Settings, and RBAC.
- Add typed mock data in one source file.
- Add route-level loading, empty, and error states.
- Add manual smoke checklist.

## Phase 02 - Local Validation

- Add automated component tests when a package manager and test framework are selected.
- Add accessibility checks.
- Add schema validation for mock data and API contracts.

## Phase 03 - Gateway Adapter Design

- Define read-only gateway adapter interfaces.
- Define production authentication requirements outside this scaffold.
- Define audit logging and redaction policies.

## Phase 04 - Controlled Mutation Readiness

- Design approval, rejection, retry, cancellation, export, and restore workflows.
- Require policy checks, RBAC, audit trails, and rollback plans before live wiring.
