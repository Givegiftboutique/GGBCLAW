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

## Phase 02 - Read-only Data Adapter Layer

- Add a read-only DashboardDataAdapter interface.
- Add a mock adapter backed by existing mock data.
- Route UI data access through the adapter registry.
- Add validation and normalization for mock data.
- Keep exported JSON, local artifact, and gateway read-only sources as future options only.
- Keep all mutation capabilities disabled and unimplemented.

## Phase 02b - Local Validation

- Add automated component tests when a package manager and test framework are selected.
- Add accessibility checks.
- Add schema validation for mock data and API contracts.

## Phase 03 - Local JSON and Artifact Source Adapters

- Add static local exported JSON adapter.
- Add static artifact manifest adapter.
- Add source query selection for `mock`, `json`, and `artifact`.
- Add source status UI and fallback reason.
- Keep OpenClaw Gateway as a future read-only design only.
- Keep all mutation capabilities disabled and unimplemented.

## Phase 04 - Gateway Adapter Design

## Phase 04 - Import / Export Contract and Snapshot Generator

- Add dashboard export and artifact manifest schemas.
- Add local snapshot generator.
- Add local snapshot validator.
- Add generated snapshot source support through the existing JSON adapter.
- Add read-only Import / Export Contract UI.
- Keep production import/export disabled and unimplemented.

## Phase 05 - Gateway Adapter Design

## Phase 05 - Quality Gates and One-command Local Verifier

- Add one-command local quality gate.
- Add standalone dashboard safety scan.
- Generate quality gate report.
- Keep all checks local; do not add CI, deploy workflow, production API, or dependencies.

## Phase 06 - UX Polish and Operator Runbook

- Add visible Runbook route at `#/dashboard/help`.
- Add operator runbook, troubleshooting guide, and release checklist.
- Add quality gate status markers to the read-only dashboard.
- Improve source status readability and active route visibility.
- Harden verifier and local quality gate coverage for runbook markers.
- Keep all mutation capabilities disabled and unimplemented.

## Phase 07 - Read-only Gateway Contract Stub

- Define read-only gateway contract fixture envelopes.
- Add local gateway-stub source mode.
- Add fixture mapper and validator.
- Keep production wiring disabled in scaffold.
- Keep all mutation capabilities disabled and unimplemented.

## Phase 08 - Gateway Stub Contract Tests and Fixture Diff

- Add local gateway contract test script.
- Add gateway fixture baseline summary.
- Add fixture diff report tool.
- Run contract tests and fixture diff inside the local quality gate.
- Keep baseline regeneration manual and intentional.
- Keep all checks local; no live Gateway, production API, deploy, CI, or dependency changes.

## Phase 09 - Gateway Adapter Design

- Define read-only gateway adapter interfaces.
- Define production authentication requirements outside this scaffold.
- Define audit logging and redaction policies.

## Phase 10 - Controlled Mutation Readiness

- Design approval, rejection, retry, cancellation, export, and restore workflows.
- Require policy checks, RBAC, audit trails, and rollback plans before live wiring.
