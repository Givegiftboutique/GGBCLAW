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

## Sprint 09A - Local Ingest and Read-only Dev Gateway

- Add JSON-only local ingest source.
- Add read-only dev gateway source disabled by default.
- Allow strict local HTTP dev hosts only.
- Add local ingest and dev gateway safety tests.
- Keep production wiring, credentials, auth, cookies, token storage, mutations, deploy, and CI out of scope.

## Phase 09 - Gateway Adapter Design

- Define read-only gateway adapter interfaces.
- Define production authentication requirements outside this scaffold.
- Define audit logging and redaction policies.

## Phase 10 - Controlled Mutation Readiness

- Design approval, rejection, retry, cancellation, export, and restore workflows.
- Require policy checks, RBAC, audit trails, and rollback plans before live wiring.

## Sprint 11A - RBAC Stub and Safe Action Drafts

- Add memory-only role simulation for viewer, operator, reviewer, admin, and audit-only.
- Add role and permission matrix UI.
- Add safe action draft previews for reviews, backups, settings, and local exports.
- Generate local draft sample artifacts by script only.
- Keep real login, auth provider, token handling, cookie handling, production permissions, gateway writes, and live mutations out of scope.

## Sprint 12A - Internal Release Workflow and Local Bundle Checks

- Add local release manifest generator.
- Add local release index generator.
- Add local release verification script.
- Add Release / Health panel.
- Document internal deployment plan, operator release workflow, and rollback using Git tags.
- Keep production deploy, GitHub Actions, CI, production Gateway, production API, mutation endpoints, secrets, and new dependencies out of scope.

## Sprint 14A - Observability Alerts and Production Readiness Review

- Add local observability alert preview with local-preview-only notification mode.
- Add generated observability report and tests.
- Add production readiness review report for internal operator beta.
- Keep recommendation no-go-for-production until real auth, production Gateway security review, secrets plan, operator signoff, backup restore drill, incident response plan, and owners are complete.
- Keep external notification delivery, production deploy, CI, production API, production Gateway, mutations, secrets, auth token, and cookie handling out of scope.

## Final Beta Audit and Operator Handoff

- Add final beta audit report generator.
- Add final beta verifier.
- Add docs index, repo hygiene guide, and operator handoff guide.
- Mark OpenClaw Dashboard as Internal Operator Beta.
- Suggest final beta tag `v0.1.0-beta`.
- Keep production no-go and keep all read-only guardrails in place.

## Sprint 15A - Real Local Data Pilot and Snapshot Refresh Drill

- Add local-only discovery for safe local files.
- Add parser, sanitizer, mapper, and validation helpers.
- Generate sanitized real local dashboard snapshot.
- Add pilot report and snapshot refresh drill.
- Keep no secrets, no `.env`, no production endpoints, no absolute machine paths in generated committed files, no network calls, no mutation, no deploy, no CI, and no new dependency.

## Sprint 15B - Traditional Chinese Localization

- Add dependency-free `zh-Hant` i18n files for user-facing dashboard strings.
- Localize sidebar labels, page titles, source badge wording, safety warnings, RBAC simulation, action draft UI, Observability / Readiness, Real Local Data Pilot, fallback/error states, and operator instructions.
- Add Traditional Chinese quick-start wording to README and docs entrypoints while preserving commands, paths, source mode values, route hashes, schema keys, and safety enum values.
- Add localization tests and include them in the one-command quality gate, safety scan, and dashboard verifier.
- Keep no production API/Gateway, no mutation endpoint, no auth/token/cookie handling, no deploy/CI, no new dependency, and no architecture rewrite.

## Sprint 16A - Dev Gateway Read-only Live Drill

- Add a localhost-only fixture gateway server bound to `127.0.0.1`.
- Add a live drill that verifies allowed localhost URLs, blocked production-like URLs, read-only GET endpoints, mutation method blocking, credentials omit, no Authorization header, and fallback behavior.
- Generate `apps/dashboard/data/generated/dev-gateway-live-drill-report.json`.
- Add Chinese UI markers for local drill only, production URL blocked, and report path.
- Keep no production API/Gateway, no mutation endpoint, no secrets, no auth/token/cookie handling, no deploy/CI, and no dependency.

## Sprint 17A - Operator Daily Workflow and Incident Drill

- Add local operator daily summary, daily workflow runner, incident drill report, evidence manifest, and workflow tests.
- Add UI markers for daily workflow, incident drill, evidence manifest, disabled escalation, disabled production incident action, and mutation disabled.
- Add docs for operator daily workflow and incident drill.
- Keep no production API/Gateway, no mutation endpoint, no secrets, no auth/token/cookie handling, no external notification, no deploy/CI, no dependency, and no absolute machine paths in generated reports.

## Sprint 18A - Internal Static Hosting Dry Run

- Add localhost-only internal static preview server.
- Add internal static hosting dry-run report and operator access checklist.
- Add UI markers and docs for preview-only hosting.
- Keep no production deploy, no public hosting default, no production API/Gateway, no mutation endpoint, no secrets, no auth/token/cookie handling, no deploy/CI, and no dependency.

## Sprint 19A - Security Privacy and Data Retention Audit

- Add local security/privacy audit report.
- Add generated report sanitization tests.
- Add data retention review and operator security checklist.
- Add UI markers and docs for security/privacy review.
- Keep this as internal beta review only, not legal compliance certification and not production approval.
- Keep production `no-go-for-production`, safety mode `read-only`, `mutationEnabled: false`, and `productionWiring: disabled`.

## Sprint 20A - v1.0.0 Internal Release Candidate and Sign-off

- Add internal release candidate report for `v1.0.0-internal-rc1`.
- Add internal sign-off package with manual reviewer placeholders.
- Add v1 internal release candidate verification and tests.
- Add UI markers and docs for RC status and pending sign-off.
- Keep `signoffStatus: pending`, `notApprovedYet: true`, and `manualSignoffRequired: true`.
- Keep production `no-go-for-production`; final `v1.0.0-internal` tag requires manual sign-off.

## Sprint 21A - Production Track Planning and Read-only Gateway Readiness

- Add production track plan, read-only production gateway readiness checklist, and production entry gates.
- Add generated reports and quality/verifier coverage for `planning-only`, `not-connected`, `not-ready`, and `blocked` statuses.
- Add Fixture Quarantine + Single Agent Truth Alignment as a required future prerequisite.
- Record that the real operator environment is expected to have only 1 real agent; 8-agent data remains mock / fixture / gateway-stub lifecycle test data only.
- Keep production `no-go-for-production`; do not connect production Gateway, deploy, add source modes, or remove read-only guardrails.
