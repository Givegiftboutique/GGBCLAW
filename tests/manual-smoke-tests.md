# Manual Smoke Tests

## Sprint 21C Single-agent Local Snapshot

Open:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

Confirm the single-agent URL renders, only 1 agent is visible, local-ingest shows Operator Truth Candidate, actual real agent count is 1, and production remains `no-go-for-production`.

Also open the older generated snapshot:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
```

If it contains 5 agents, the UI must show real local snapshot review required. `mock` and `gateway-stub` must still show fixture warnings.

## Sprint 21B Fixture Quarantine

Open:

```text
http://localhost:5173/
http://localhost:5173/?source=mock
http://localhost:5173/?source=gateway-stub
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
http://localhost:5173/?source=gateway-stub#/dashboard/settings
http://localhost:5173/?source=gateway-stub#/dashboard/help
http://localhost:5173/?source=gateway-stub#/dashboard/observability
```

Confirm `mock` shows Demo Fixture Data, `gateway-stub` shows Contract Fixture Data, `local-ingest` shows Operator Truth Candidate, expected real agent count is 1, 8 agents are fixture only, and production remains `no-go-for-production`.

## OpenClaw Dashboard Scaffold

Task: `TASK-20260609-OC-DASH-001`

1. Open `apps/dashboard/index.html` in a browser. If `file://` is blocked, run `python -m http.server 5173` from `apps/dashboard` and open `http://localhost:5173/`.
2. Confirm the sidebar shows Overview, Agents, Tasks, Reviews, Logs, Backups, Settings, RBAC, and Runbook.
3. Select each navigation item and confirm the page content changes without a reload.
4. Confirm these direct routes render: `#/dashboard`, `#/agents`, `#/tasks`, `#/reviews`, `#/logs`, `#/backups`, `#/settings`, `#/rbac`, and `#/dashboard/help`.
5. On Overview, confirm gateway, active agents, running tasks, failed/lost tasks, backup verification, KPI cards, and recent activity render.
6. On Agents, confirm the eight agent records render with role, runtime, model, workspace, sandbox, tools, status, heartbeat, and risk.
7. On Tasks, change status and priority filters and confirm the table updates.
8. On Reviews, confirm approve/reject controls are disabled or mock-only and labelled as scaffold actions.
9. On Logs, use search and severity filters and confirm log rows update.
10. On Backups, confirm backup manifests and evidence-chain entries render, with no real backup or restore action available.
11. On Settings, confirm all production mutation controls are disabled/read-only and the page clearly states production mutation is disabled.
12. On Reviews, confirm approve/reject buttons are disabled.
13. Resize the browser to a narrow width and confirm the dashboard remains readable with no overlapping text.
14. Confirm the browser console has no adapter or validation errors.
15. Confirm the UI still shows `mock-only`, `read-only`, and `Production mutations disabled` guardrails.

## Expected Result

All dashboard routes are reachable, mock data is visible, no production endpoint is called, and no secret-like values are displayed.

## Phase 02 Adapter Checks

- Dashboard data should render through the mock adapter, not direct production APIs.
- `apps/dashboard/verify-dashboard.mjs` should pass before manual acceptance.
- No real approve, reject, backup, restore, settings update, task delete, or task cancel action should be available.

## Phase 03 Source Adapter Checks

1. Open `http://localhost:5173/?source=mock` and confirm the dashboard renders.
2. Open `http://localhost:5173/?source=json` and confirm the dashboard renders.
3. Open `http://localhost:5173/?source=artifact` and confirm the dashboard renders.
4. Open `http://localhost:5173/?source=json&data=./data/dashboard-export.sample.json` and confirm the dashboard renders.
5. Open `http://localhost:5173/?source=gateway-stub` and confirm the dashboard renders.
6. Open an invalid local source path, such as `http://localhost:5173/?source=json&data=./data/missing.json`, and confirm the dashboard falls back to mock with a warning.
7. Confirm the source badge and validation status are visible.
8. Confirm the browser console has no red errors.
9. Confirm all routes remain reachable.
10. Confirm Reviews remain disabled/mock-only.
11. Confirm Backups remain evidence-only with no real backup or restore action.
12. Confirm Settings remain read-only and production mutation disabled.

## Phase 04 Snapshot Checks

1. Run `node apps/dashboard/scripts/generate-dashboard-snapshot.mjs`.
2. Confirm `apps/dashboard/data/generated/dashboard-export.generated.json` exists.
3. Run `node apps/dashboard/scripts/validate-dashboard-snapshot.mjs apps/dashboard/data/dashboard-export.sample.json`.
4. Run `node apps/dashboard/scripts/validate-dashboard-snapshot.mjs apps/dashboard/data/generated/dashboard-export.generated.json`.
5. Open `http://localhost:5173/?source=json&data=./data/generated/dashboard-export.generated.json`.
6. Confirm source badge shows `json`.
7. Confirm validation status is visible.
8. Confirm `Import / Export Contract` is visible.
9. Confirm import button is disabled/scaffold-only.
10. Confirm production export action is absent.
11. Confirm all routes remain reachable.
12. Confirm the browser console has no red errors.

## Phase 05 Quality Gate Checks

1. Run `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs` from the repository root.
2. Confirm the command prints `OpenClaw Dashboard quality gates passed.`
3. Confirm `apps/dashboard/data/generated/quality-gate-report.json` exists.
4. Run `node apps/dashboard/scripts/safety-scan-dashboard.mjs`.
5. Confirm the safety scan reports no active mutation functions, secret-like assignments, or production endpoints.
6. Repeat the manual browser test for `http://localhost:5173/?source=json&data=./data/generated/dashboard-export.generated.json`.

## Phase 06 UX Polish and Runbook Checks

1. Open `http://localhost:5173/`.
2. Confirm the sidebar includes Runbook and the active route marker is visible.
3. Open `http://localhost:5173/#/dashboard/help`.
4. Confirm the Runbook page is visible and includes What this dashboard is, What this dashboard is not, Safe operating rules, Data sources, How to run local server, How to run quality gates, How to generate snapshot, How to validate snapshot, troubleshooting notes, odd root-level file guidance, and What not to do.
5. Confirm the status strip includes Data source, Health, Validation, Fallback, Fallback reason, Safety mode, and Last loaded.
6. Confirm Overview and Settings show Quality gate status.
7. Open `http://localhost:5173/?source=json&data=./data/generated/dashboard-export.generated.json#/dashboard/help`.
8. Confirm the generated snapshot still renders the Runbook route.
9. Confirm browser console has no red errors.
10. Confirm the UI says do not connect production API, do not enable mutation, do not read secrets, and do not commit junk root files.

## Phase 07 Gateway Contract Stub Checks

1. Open `http://localhost:5173/?source=gateway-stub`.
2. Confirm the dashboard renders and the status strip shows `Data source: gateway-stub`.
3. Confirm `Validation: passed`, `Safety mode: read-only`, and `Production wiring: disabled`.
4. Confirm Overview, Agents, Tasks, Reviews, Logs, Backups, Settings, RBAC, and Runbook remain reachable.
5. Confirm Agents still shows 8 agents.
6. Confirm Tasks still includes queued, running, review_pending, succeeded, failed, timed_out, cancelled, and lost.
7. Confirm Reviews controls remain disabled or mock-only.
8. Confirm Backups remain evidence-only with no real backup or restore action.
9. Confirm Settings remains read-only and Production mutations disabled.
10. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
11. Confirm Runbook mentions gateway-stub mode and production wiring disabled.
12. Confirm browser console has no red errors.

## Phase 08 Gateway Contract Test and Fixture Diff Checks

1. Run `node apps/dashboard/scripts/generate-gateway-contract-baseline.mjs` only when intentionally refreshing the gateway-stub baseline.
2. Run `node apps/dashboard/scripts/test-gateway-contract.mjs`.
3. Confirm it prints `OpenClaw gateway stub contract tests passed.`
4. Run `node apps/dashboard/scripts/diff-gateway-fixtures.mjs`.
5. Confirm it prints `OpenClaw gateway fixture diff passed.`
6. Open `apps/dashboard/data/generated/gateway-fixture-diff-report.json`.
7. Confirm `result` is `pass`.
8. Run `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`.
9. Confirm the quality gate report includes gateway contract tests and gateway fixture diff results.
10. Open `http://localhost:5173/?source=gateway-stub`.
11. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
12. Confirm Runbook / Help includes gateway-stub and contract test guidance.
13. Confirm Reviews, Backups, and Settings safety guardrails remain unchanged.
14. Confirm browser console has no red errors.

## Sprint 09A Local Ingest and Dev Gateway Checks

1. Run `node apps/dashboard/scripts/test-local-ingest.mjs`.
2. Run `node apps/dashboard/scripts/test-dev-gateway-config.mjs`.
3. Open `http://localhost:5173/?source=local-ingest`.
4. Open `http://localhost:5173/?source=local-ingest&data=./data/local-ingest/local-dashboard-ingest.sample.json`.
5. Open `http://localhost:5173/?source=dev-gateway`.
6. Confirm missing baseUrl falls back safely and does not show production wiring.
7. Open `http://localhost:5173/?source=dev-gateway&baseUrl=http://localhost:8787`.
8. Confirm localhost baseUrl is allowed and falls back if the local server is absent.
9. Open `http://localhost:5173/?source=dev-gateway&baseUrl=https://production.example.com`.
10. Confirm production-like baseUrl is blocked and fallback is visible.
11. Confirm source badge, validation status, safety mode read-only, production wiring disabled, and mutation enabled false are visible.
12. Confirm Runbook / Help mentions local-ingest and dev-gateway rules.
13. Confirm Reviews, Backups, and Settings safety guardrails remain unchanged.
14. Confirm browser console has no red errors.

## Sprint 11A RBAC and Action Draft Checks

1. Run `node apps/dashboard/scripts/test-rbac-policy.mjs`.
2. Run `node apps/dashboard/scripts/generate-action-draft-samples.mjs`.
3. Run `node apps/dashboard/scripts/test-action-drafts.mjs`.
4. Open `http://localhost:5173/?source=local-ingest#/dashboard/rbac`.
5. Confirm RBAC route shows role matrix, permission matrix, guardrail summary, and current simulated role.
6. Switch simulated role and confirm the UI updates without browser storage or cookie writes.
7. Open `http://localhost:5173/?source=gateway-stub#/dashboard/reviews`.
8. Generate approve, reject, and needs changes draft previews; confirm they are not submitted.
9. Open `http://localhost:5173/?source=gateway-stub#/dashboard/backups`.
10. Generate backup verification draft; confirm no backup or restore runs.
11. Open `http://localhost:5173/?source=gateway-stub#/dashboard/settings`.
12. Generate settings change request draft; confirm settings do not update.
13. Confirm every draft shows dryRun true, mutationEnabled false, productionWiring disabled, requiresHumanApproval true, and notSubmitted true.
14. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
15. Confirm Runbook mentions RBAC simulation and action drafts.
16. Confirm browser console has no red errors.

## Sprint 12A Internal Release Workflow Checks

1. Run `node apps/dashboard/scripts/generate-release-manifest.mjs`.
2. Run `node apps/dashboard/scripts/create-local-release-bundle.mjs`.
3. Run `node apps/dashboard/scripts/verify-local-release.mjs`.
4. Open `http://localhost:5173/?source=local-ingest#/dashboard`.
5. Open `http://localhost:5173/?source=gateway-stub#/dashboard/settings`.
6. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
7. Confirm Release / Health panel is visible.
8. Confirm release mode static-read-only.
9. Confirm safety mode read-only.
10. Confirm mutation enabled false.
11. Confirm production wiring disabled.
12. Confirm release manifest path is visible.
13. Confirm rollback tag suggestion is visible.
14. Confirm deploy buttons are disabled.
15. Confirm sidebar routes still switch.
16. Confirm browser console has no red errors.

## Sprint 14A Observability and Production Readiness Checks

1. Run `node apps/dashboard/scripts/generate-observability-report.mjs`.
2. Run `node apps/dashboard/scripts/test-observability.mjs`.
3. Run `node apps/dashboard/scripts/generate-production-readiness-report.mjs`.
4. Run `node apps/dashboard/scripts/test-production-readiness.mjs`.
5. Open `http://localhost:5173/?source=local-ingest#/dashboard`.
6. Open `http://localhost:5173/?source=local-ingest#/dashboard/observability`.
7. Open `http://localhost:5173/?source=gateway-stub#/dashboard/observability`.
8. Open `http://localhost:5173/?source=gateway-stub#/dashboard/settings`.
9. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
10. Confirm Observability route or panel is visible.
11. Confirm alert counts and alert preview list are visible.
12. Confirm notification mode local-preview-only.
13. Confirm notificationSent false.
14. Confirm safety mode read-only.
15. Confirm production wiring disabled.
16. Confirm mutation enabled false.
17. Confirm Production readiness summary is visible.
18. Confirm production deploy false.
19. Confirm recommendation no-go-for-production.
20. Confirm internal operator beta status is clear.
21. Confirm no deploy button and no external alert delivery button are active.
22. Confirm sidebar routes still switch.
23. Confirm browser console has no red errors.

## Final Beta Audit and Operator Handoff Checks

1. Run `node apps/dashboard/scripts/generate-final-beta-audit.mjs`.
2. Run `node apps/dashboard/scripts/verify-final-beta.mjs`.
3. Confirm `apps/dashboard/data/generated/final-beta-audit-report.json` exists.
4. Confirm `apps/dashboard/README.md` starts with Internal Operator Beta status.
5. Confirm `docs/dashboard/README.md` lists quick start, source modes, operator handoff, repo hygiene, troubleshooting, and manual smoke tests.
6. Confirm `docs/dashboard/openclaw-dashboard-repo-hygiene.md` says do not use `git add .`.
7. Confirm `docs/dashboard/openclaw-dashboard-operator-handoff.md` lists source modes and production blockers.
8. Open `http://localhost:5173/?source=local-ingest#/dashboard`.
9. Open `http://localhost:5173/?source=local-ingest#/dashboard/observability`.
10. Open `http://localhost:5173/?source=gateway-stub#/dashboard/settings`.
11. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
12. Confirm Internal Operator Beta status is clear in README/docs and UI guardrails remain read-only.
13. Confirm Release / Health panel is normal.
14. Confirm Observability / Readiness panel is normal.
15. Confirm safety mode read-only, mutation enabled false, production wiring disabled, and production recommendation no-go.
16. Confirm no deploy button or external alert delivery is active.
17. Confirm sidebar routes still switch.
18. Confirm browser console has no red errors.

## Sprint 15A Real Local Data Pilot Checks

1. Run `node apps/dashboard/scripts/discover-real-local-data.mjs`.
2. Run `node apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs`.
3. Run `node apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs`.
4. Run `node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs`.
5. Run `node apps/dashboard/scripts/test-real-local-data-pilot.mjs`.
6. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json`.
7. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json#/dashboard/observability`.
8. Open `http://localhost:5173/?source=local-ingest#/dashboard/help`.
9. Open `http://localhost:5173/?source=local-ingest#/dashboard/settings`.
10. Confirm Real Local Data Pilot marker is visible.
11. Confirm snapshot refresh drill command is visible.
12. Confirm safety mode read-only, mutation enabled false, and production wiring disabled.
13. Confirm absolute paths redacted, secrets redacted, and production endpoints blocked.
14. Confirm Observability / Readiness panels render.
15. Confirm sidebar routes still switch.
16. Confirm browser console has no red errors.

## Sprint 15B Traditional Chinese Localization Checks

1. Run `node apps/dashboard/scripts/test-dashboard-localization.mjs`.
2. Run `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`.
3. Run `node apps/dashboard/scripts/safety-scan-dashboard.mjs`.
4. Run `node apps/dashboard/verify-dashboard.mjs`.
5. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json`.
6. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json#/dashboard/observability`.
7. Open `http://localhost:5173/?source=gateway-stub#/dashboard/rbac`.
8. Open `http://localhost:5173/?source=gateway-stub#/dashboard/reviews`.
9. Open `http://localhost:5173/?source=gateway-stub#/dashboard/settings`.
10. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
11. Confirm sidebar labels are Traditional Chinese or bilingual Chinese/technical labels.
12. Confirm page titles, source badge labels, safety warnings, RBAC, action draft, Observability, and Real Local Data Pilot wording are readable in Traditional Chinese.
13. Confirm `read-only`, `mutationEnabled false`, `productionWiring disabled`, and `no-go-for-production` remain visible.
14. Confirm route hash values and source mode query values still work unchanged.
15. Confirm all pages still switch and browser console has no red errors.

## Sprint 16A Dev Gateway Read-only Live Drill Checks

1. Run `node apps/dashboard/scripts/start-dev-gateway-fixture-server.mjs --port 8787`.
2. In another terminal, run `python -m http.server 5173` from `apps/dashboard`.
3. Run `node apps/dashboard/scripts/run-dev-gateway-live-drill.mjs`.
4. Run `node apps/dashboard/scripts/test-dev-gateway-live-drill.mjs`.
5. Open `http://localhost:5173/?source=dev-gateway&baseUrl=http://localhost:8787`.
6. Open `http://localhost:5173/?source=dev-gateway&baseUrl=http://127.0.0.1:8787`.
7. Open `http://localhost:5173/?source=dev-gateway&baseUrl=https://production.example.com`.
8. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
9. Open `http://localhost:5173/?source=gateway-stub#/dashboard/settings`.
10. Confirm dev-gateway renders with localhost allowed.
11. Confirm production-like URL is blocked and falls back.
12. Confirm Chinese live drill markers, `credentials: omit`, no Authorization header marker, safety mode read-only, mutation enabled false, and production wiring disabled.
13. Confirm no console red errors and no successful mutation method records.

## Sprint 17A Operator Daily Workflow and Incident Drill Checks

1. Run `node apps/dashboard/scripts/generate-operator-daily-summary.mjs`.
2. Run `node apps/dashboard/scripts/run-operator-daily-workflow.mjs`.
3. Run `node apps/dashboard/scripts/run-operator-incident-drill.mjs`.
4. Run `node apps/dashboard/scripts/generate-operator-evidence-manifest.mjs`.
5. Run `node apps/dashboard/scripts/test-operator-workflow.mjs`.
6. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json`.
7. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json#/dashboard/observability`.
8. Open `http://localhost:5173/?source=gateway-stub#/dashboard/settings`.
9. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
10. Confirm Operator Daily Workflow panel is visible.
11. Confirm Incident drill report path and Evidence manifest path are visible.
12. Confirm `read-only`, `mutationEnabled false`, `productionWiring disabled`, `notificationSent false`, and production no-go are visible.
13. Confirm external escalation, production incident action, and mutation controls are disabled.
14. Confirm routes switch and browser console has no red errors.

## Sprint 18A Internal Static Hosting Dry Run Checks

1. Run `node apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs`.
2. Run `node apps/dashboard/scripts/generate-operator-access-checklist.mjs`.
3. Run `node apps/dashboard/scripts/test-internal-static-hosting.mjs`.
4. Run `node apps/dashboard/scripts/start-internal-static-preview.mjs --port 5180`.
5. Open `http://127.0.0.1:5180/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json`.
6. Open `http://127.0.0.1:5180/?source=gateway-stub#/dashboard/settings`.
7. Open `http://127.0.0.1:5180/?source=gateway-stub#/dashboard/help`.
8. Open `http://127.0.0.1:5180/?source=gateway-stub#/dashboard/observability`.
9. Confirm Dashboard renders with Chinese UI.
10. Confirm Internal Static Hosting Dry Run panel is visible.
11. Confirm preview server command, dry-run report path, and access checklist path are visible.
12. Confirm `read-only`, `mutationEnabled false`, `productionWiring disabled`, `productionDeploy false`, and production no-go are visible.
13. Confirm production deploy, public hosting, and external access controls are disabled.
14. Confirm sidebar routes switch and browser console has no red errors.

## Sprint 19A Security Privacy and Data Retention Audit Checks

1. Run `node apps/dashboard/scripts/generate-security-privacy-audit.mjs`.
2. Run `node apps/dashboard/scripts/test-generated-report-sanitization.mjs`.
3. Run `node apps/dashboard/scripts/generate-data-retention-review.mjs`.
4. Run `node apps/dashboard/scripts/generate-operator-security-checklist.mjs`.
5. Run `node apps/dashboard/scripts/test-security-privacy-audit.mjs`.
6. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json`.
7. Open `http://localhost:5173/?source=gateway-stub#/dashboard/settings`.
8. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
9. Open `http://localhost:5173/?source=gateway-stub#/dashboard/observability`.
10. Confirm Security / Privacy Audit panel is visible.
11. Confirm Data Retention Review and Operator Security Checklist markers are visible.
12. Confirm report paths are visible.
13. Confirm `read-only`, `mutationEnabled false`, `productionWiring disabled`, production no-go, and `draft-for-internal-review` are visible.
14. Confirm production security approval and public sharing controls are disabled.
15. Confirm sidebar routes switch and browser console has no red errors.

## Sprint 20A v1 Internal Release Candidate Checks

1. Run `node apps/dashboard/scripts/generate-internal-release-candidate.mjs`.
2. Run `node apps/dashboard/scripts/generate-internal-signoff-package.mjs`.
3. Run `node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs`.
4. Run `node apps/dashboard/scripts/test-internal-release-candidate.mjs`.
5. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json`.
6. Open `http://localhost:5173/?source=gateway-stub#/dashboard/settings`.
7. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
8. Open `http://localhost:5173/?source=gateway-stub#/dashboard/observability`.
9. Confirm v1.0.0 Internal Release Candidate panel is visible.
10. Confirm candidate tag `v1.0.0-internal-rc1` is visible.
11. Confirm final internal tag `v1.0.0-internal` is visible.
12. Confirm `signoffStatus pending`, `manualSignoffRequired true`, and `notApprovedYet true`.
13. Confirm `productionStatus no-go-for-production`, `read-only`, `mutationEnabled false`, and `productionWiring disabled`.
14. Confirm there is no sign-off approval button and no production release button.
15. Confirm sidebar routes switch and browser console has no red errors.

## Sprint 21A Production Track Planning Checks

1. Run `node apps/dashboard/scripts/generate-production-track-plan.mjs`.
2. Run `node apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs`.
3. Run `node apps/dashboard/scripts/generate-production-entry-gates.mjs`.
4. Run `node apps/dashboard/scripts/test-production-track-planning.mjs`.
5. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json`.
6. Open `http://localhost:5173/?source=gateway-stub#/dashboard/settings`.
7. Open `http://localhost:5173/?source=gateway-stub#/dashboard/help`.
8. Open `http://localhost:5173/?source=gateway-stub#/dashboard/observability`.
9. Confirm Production Track Planning panel is visible.
10. Confirm Read-only Production Gateway Readiness and Production Entry Gates report paths are visible.
11. Confirm current release `v1.0.0-internal` is visible.
12. Confirm `productionStatus no-go-for-production`, `productionTrackStatus planning-only`, `gatewayConnectionStatus not-connected`, `readinessStatus not-ready`, and `entryGateStatus blocked`.
13. Confirm the panel says the real operator environment is expected to have only 1 real agent and 8-agent data is fixture/mock only.
14. Confirm Fixture Quarantine + Single Agent Truth Alignment is listed as a future prerequisite.
15. Confirm no production gateway connect button, production deploy button, or mutation button exists.
16. Confirm sidebar routes switch and browser console has no red errors.

## Sprint 21D Operator Source Selection Lockdown Checks

1. Run `node apps/dashboard/scripts/generate-operator-source-lockdown-report.mjs`.
2. Run `node apps/dashboard/scripts/generate-operator-source-selection-checklist.mjs`.
3. Run `node apps/dashboard/scripts/test-operator-source-lockdown.mjs`.
4. Open `http://localhost:5173/`.
5. Confirm `/` shows an operator source selection notice and recommended single-agent URL.
6. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json`.
7. Confirm local-ingest single-agent view shows 1 agent and Operator Truth Candidate.
8. Open `http://localhost:5173/?source=mock`.
9. Confirm mock shows high fixture warning.
10. Open `http://localhost:5173/?source=gateway-stub`.
11. Confirm gateway-stub shows high contract fixture warning.
12. Confirm 8 agents are marked fixture only.
13. Confirm `productionStatus no-go-for-production`, `read-only`, `mutationEnabled false`, and `productionWiring disabled`.
14. Confirm no production gateway connect button, production deploy button, or mutation button exists.
## Sprint 22A local real agent health

- Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json`.
- Confirm Local Real Agent Health / 本地真實 Agent 健康狀態 is visible.
- Confirm health source = local-file-only.
- Confirm expected real agent count = 1 and actual real agent count = 1.
- Confirm no restart / stop / start action exists.
- Confirm no production gateway connect button and no mutation button.
- Confirm mock/gateway-stub still show fixture high warnings.

## Sprint 22B Manual Smoke - Sanitized Local Health Intake

- Open `/`, Agents, Observability, Settings, Help, `?source=mock`, and `?source=gateway-stub`.
- Confirm Local Real Agent Health panel is visible.
- Confirm `local-reviewed-json` or `local-file-only` marker is visible.
- Confirm `reviewed-local-agent-health.json` path is visible.
- Confirm expected/actual real agent count remains 1 for the single-agent local-ingest view.
- Confirm no restart / stop / start, no mutation, and no production gateway button exists.

## Sprint 22C Manual Smoke - Local Health Evidence Review

- Open `/`, Agents, Observability, Settings, Help, `?source=mock`, and `?source=gateway-stub`.
- Confirm Local Health Evidence Review panel is visible.
- Confirm evidence status is visible.
- Confirm accepted health source is `local-reviewed-json` or `local-file-only`.
- Confirm fallback used and fallback reason are visible.
- Confirm redaction applied = yes.
- Confirm raw values printed = no.
- Confirm reviewed local input path is visible.
- Confirm no restart / stop / start action exists.
- Confirm no production gateway connect button and no mutation button.

## Sprint 23A Manual Smoke - Operator Usability MVP

1. From repo root, run `.\apps\dashboard\scripts\start-operator-dashboard.ps1`.
2. If port `5173` is busy, run `.\apps\dashboard\scripts\start-operator-dashboard.ps1 -Port 5174`.
3. Open `http://localhost:5173/`.
4. Confirm Operator Home / Operator 首頁 is visible.
5. Confirm the recommended single-agent URL is visible and the Open recommended operator view link works.
6. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json`.
7. Confirm the local-ingest single-agent view shows 1 agent, Local Real Agent Health, and Local Health Evidence Review.
8. Open Agents, Observability, Settings, and Help with the recommended URL.
9. Open `http://localhost:5173/?source=mock` and confirm high fixture warning plus "This is not the daily operator view".
10. Open `http://localhost:5173/?source=gateway-stub` and confirm high contract fixture warning plus "This is not the daily operator view".
11. Confirm restart / stop / start action, production gateway connect button, mutation button, and production deploy button do not exist.
12. Confirm `productionStatus no-go-for-production`, `read-only`, `mutationEnabled false`, and `productionWiring disabled`.

## Sprint 23B Manual Smoke - Daily Operator Runbook Mode

1. From repo root, run `.\apps\dashboard\scripts\start-operator-dashboard.ps1`.
2. Open `http://localhost:5173/`.
3. Confirm Operator Home is visible.
4. Confirm Daily Operator Runbook panel is visible.
5. Confirm today status is visible.
6. Confirm status reasons are visible.
7. Confirm safe next steps are visible.
8. Confirm blocked actions are visible.
9. Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json`.
10. Confirm the local-ingest single-agent view shows 1 agent, Local Real Agent Health, and Local Health Evidence Review.
11. Open Agents, Observability, Settings, and Help with the recommended URL.
12. Open `http://localhost:5173/?source=mock` and confirm Fixture Mode / not daily operator view.
13. Open `http://localhost:5173/?source=gateway-stub` and confirm Fixture Mode / not daily operator view.
14. Confirm restart / stop / start action, production gateway connect button, mutation button, and production deploy button do not exist.
15. Confirm `productionStatus no-go-for-production`, `read-only`, `mutationEnabled false`, and `productionWiring disabled`.
## Sprint 23C Manual Smoke - Reviewed Health Input Assistant

1. Launch the operator dashboard.
2. Confirm Reviewed Health Input Assistant panel is visible.
3. Confirm template path, local input path, dry-run readiness, redaction applied, raw values printed false, and local-only-do-not-commit policy are visible.
4. Confirm missing local input shows safe template-copy next steps.
5. Confirm no restart, mutation, production gateway, deploy, auth, token, cookie, or secret controls exist.

## Sprint 24A Production Entry Gate

- Confirm Production Entry Gate panel is visible.
- Confirm gate status is visible.
- Confirm productionReady is No / false.
- Confirm production status is no-go-for-production.
- Confirm production gateway, mutation, restart, deploy, and approve actions are disabled or absent.

## Sprint 24B Production Adapter Simulator

- Confirm Read-only Production Adapter Simulator panel is visible.
- Confirm adapter status is visible.
- Confirm productionReady is No / false.
- Confirm adapterEnabled is No / false.
- Confirm connected is No / false.
- Confirm simulatorOnly is Yes / true.
- Confirm endpointConfigured is No / false and authEnabled is No / false.
- Confirm no production connect, endpoint input, auth token input, mutation, deploy, restart, stop, or start controls exist.

## Sprint 25A Read-only Adapter Contract + Disabled Draft

1. Launch the operator dashboard.
2. Open `http://localhost:5173/`.
3. Confirm Operator Home, Daily Operator Runbook, Production Entry Gate, and Read-only Production Adapter Simulator panels are visible.
4. Confirm Read-only Adapter Contract Review panel is visible.
5. Confirm Disabled Read-only Adapter Draft panel is visible.
6. Confirm Dashboard Stabilization Audit panel is visible.
7. Confirm `productionReady`, `adapterEnabled`, `connected`, `endpointConfigured`, `authEnabled`, and `dataReturned` show No / false.
8. Confirm production gateway, mutation, restart, deploy, endpoint input, auth/token input, and production connect controls do not exist.
9. Open `?source=mock` and `?source=gateway-stub`; confirm fixture mode warnings remain visible and not daily operator truth.
10. Confirm browser console has no red errors.

## Sprint 25B Final Local Operator Release Candidate Audit

1. Launch the operator dashboard.
2. Open `http://localhost:5173/`.
3. Confirm Local Operator Release Candidate panel is visible.
4. Confirm RC status and daily use available are visible.
5. Confirm final checklist, known risk register, and report index paths are visible.
6. Confirm Operator Home, Daily Runbook, Local Health, Evidence, Reviewed Health Input Assistant, Production Entry Gate, Production Adapter Simulator, Read-only Adapter Contract Review, Disabled Adapter Draft, and Stabilization Audit panels are visible.
7. Confirm `productionReady`, `adapterEnabled`, `connected`, `endpointConfigured`, `authEnabled`, and `dataReturned` show No / false.
8. Confirm production gateway, mutation, restart, deploy, endpoint input, auth/token input, and production connect controls do not exist.
9. Open `?source=mock` and `?source=gateway-stub`; confirm fixture mode warnings remain visible and not daily operator truth.
10. Confirm browser console has no red errors.

## Sprint 25C Operator UX + Task Visibility + Hourly Refresh + Balance Center

1. Launch the operator dashboard.
2. Open `http://localhost:5173/`.
3. Confirm the first screen is clear Chinese operator wording.
4. Confirm 今日任務 panel is visible.
5. Confirm WhatsApp 任務同步 status is visible and missing WhatsApp tasks are explained as not yet synced.
6. Confirm 每 1 小時自動刷新, 上次刷新, 下次刷新時間, and 立即刷新 are visible.
7. Confirm 用量與餘額中心 is visible.
8. Confirm QWE API, Huawei LLM Agent, and Intenext Codex cards are visible.
9. Confirm no password, API key, session-secret, browser session value, or credential value is displayed.
10. Confirm Production 安全鎖 remains visible.
11. Confirm Local Operator RC, Daily Runbook, Local Health, Evidence, Reviewed Health Input Assistant, Production Entry Gate, Production Adapter Simulator, Read-only Adapter Contract Review, Disabled Adapter Draft, and Stabilization Audit panels remain visible.
12. Confirm local-ingest still shows 1 agent.
13. Confirm mock and gateway-stub still show fixture warnings.
14. Confirm no production connect button, endpoint input, auth/token input, mutation button, restart button, or deploy button exists.
15. Confirm browser console has no red errors.

## Sprint 25D Chinese-first Operator UX Copy Hardening

1. Launch the operator dashboard.
2. Confirm every main page title is Chinese-first.
3. Confirm Agents page title is `Agent 狀態` and explains Dashboard is read-only.
4. Confirm Tasks page title is `今日任務` and shows task counts, readable statuses, and next steps.
5. Confirm Reviews page title is `安全審查` and permission keys are not shown as the main visual content.
6. Confirm raw enum/key values appear only in collapsed `技術詳情` sections.
7. Confirm Production guardrails remain visible in Chinese.
8. Confirm no production connect button, endpoint input, auth/token input, mutation button, restart button, or deploy button exists.
9. Confirm browser console has no red errors.

## Sprint 25E Operator Console Visual Redesign

1. Launch the operator dashboard.
2. Confirm `/` shows `OpenClaw Operator Console` and `今日營運總覽`.
3. Confirm `#/dashboard/agents` shows `Agent 狀態` and does not show the old `Agents / 代理程式` title.
4. Confirm `#/dashboard/tasks` shows card-based `今日任務` work queue, not a spreadsheet-first table.
5. Confirm `#/dashboard/reviews` and `#/dashboard/rbac` do not show permission key dumps as the main visual content.
6. Confirm `用量與餘額` provider cards and `自動刷新` system card are visible.
7. Confirm technical values are under `技術詳情（一般情況不用查看）`.
8. Confirm no production connect button, endpoint input, auth/token input, mutation button, restart button, or deploy button exists.
9. Confirm browser console has no red errors.

## Sprint 26A Local OpenClaw Read-only Connector

1. Launch the operator dashboard.
2. Open `http://localhost:5173/`.
3. Confirm `本機 OpenClaw 連接` panel is visible.
4. If no local connector config exists, confirm it says `本機 OpenClaw 未連接` and explains this is not a Dashboard failure.
5. Open `#/dashboard/agents` and confirm Agent source labeling remains clear.
6. Open `#/dashboard/tasks` and confirm task source labeling remains clear.
7. Confirm hourly refresh includes `local-openclaw-connector-report.json`.
8. Confirm no production connect button, endpoint input, auth/token input, mutation button, restart button, or deploy button exists.
9. Confirm browser console has no red errors.

## Sprint 26B - Local OpenClaw Activation Assistant

Sprint 26B adds a local-only activation assistant for the read-only connector. Operators can create an ignored local config for localhost GET endpoints or an ignored local export file. No API key, password, token, auth input, mutation, restart, deploy, external API, or Production Gateway is added. Production remains `no-go-for-production`.

## Sprint 26D - Local OpenClaw Export Bridge

1. Run `node apps/dashboard/scripts/generate-openclaw-local-export-from-safe-sources.mjs`.
2. Run `node apps/dashboard/scripts/test-local-openclaw-real-bridge.mjs`.
3. Open `http://localhost:5173/`.
4. Confirm the Local OpenClaw panel says the service responded but has not provided Agent/task lists when only `/health` is available.
5. Confirm the UI recommends `/api/local/export` or a local export file.
6. Confirm no endpoint input, auth/token input, mutation/restart/deploy button, or production connect button exists.

## Sprint 26G - WSL Local OpenClaw Safe Export Adapter

1. Run the WSL adapter dry run.
2. If dry run is safe, generate the ignored local export file.
3. Run the local OpenClaw connector.
4. Open `http://localhost:5173/`.
5. Confirm the Local OpenClaw panel shows the WSL safe export source when the export exists.
6. Confirm Agent count appears if safe Agent metadata was exported.
7. If tasks are skipped, confirm the UI explains that task data may contain sensitive content.
8. Confirm no raw prompt/session/body/content, API key, password, token, endpoint input, auth input, mutation/restart/deploy button, or production connect button appears.

## Sprint 27A - Safe Task Metadata Discovery

1. Run `node apps/dashboard/scripts/discover-wsl-openclaw-task-metadata-schema.mjs --distro Ubuntu-24.04 --state-dir <WSL_OPENCLAW_STATE_DIR> --dry-run`.
2. Confirm the generated discovery report says `schemaOnly: true`.
3. Confirm `rawRowsRead: false`, `rawTaskContentPrinted: false`, and `secretRedactionApplied: true`.
4. Open `http://localhost:5173/`.
5. Confirm the Local OpenClaw panel explains task data is not displayed yet and only metadata schema discovery is being done.
6. Confirm task count is not faked and raw task rows are not shown.
7. Confirm no endpoint input, auth input, mutation/restart/deploy button, or production connect button appears.

## Sprint 28A - WhatsApp Local Task Import

1. Run `node apps/dashboard/scripts/generate-whatsapp-local-task-import-report.mjs`.
2. Run `node apps/dashboard/scripts/generate-local-task-inbox-report.mjs`.
3. Open `http://localhost:5173/`.
4. Confirm `WhatsApp 任務匯入` is visible.
5. Confirm the UI says there is no WhatsApp API, webhook, QR login, token, cookie, session, or auto-reply.
6. Confirm real `apps/dashboard/data/local/whatsapp-task-import.json` is ignored and not tracked.

## Sprint 28B - WhatsApp Local Task Helper

1. Run `node apps/dashboard/scripts/build-whatsapp-local-task-import.mjs`.
2. Run `node apps/dashboard/scripts/test-whatsapp-local-task-helper.mjs`.
3. Open `http://localhost:5173/`.
4. Confirm `WhatsApp 任務小助手` is visible.
5. Confirm the PowerShell helper command and local helper input path are visible.
6. Confirm there is no WhatsApp API, webhook, QR login, token/cookie/session input, auto-reply, Production connect, mutation, restart, or deploy button.
7. Confirm real `apps/dashboard/data/local/whatsapp-task-helper-input.txt` and `apps/dashboard/data/local/whatsapp-task-import.json` are ignored and not tracked.

## Sprint 28C - WhatsApp Sync Safety Design

1. Open the WhatsApp sync safety design document.
2. Confirm it says 28C is design-only and the current flow remains local-only.
3. Confirm there is no WhatsApp API code, webhook route, QR login, token input, cookie/session reader, Production connect, mutation, restart, or deploy button.
4. Confirm future sync is blocked by safety gates for privacy, consent, secret handling, webhook verification, replay protection, redacted logs, retention, and legal review.

## Sprint 28D - WhatsApp Sync Mock Contract

1. Run the offline mock contract report generator.
2. Run the mock contract test.
3. Confirm there are no network calls, no webhook route, no QR login, and no production connection.
4. Confirm only fake fixture labels are used.

## Sprint 28D-28F - WhatsApp Offline Sync Readiness Bundle

1. Run the mock contract generator and fake webhook fixture runner.
2. Confirm the Dashboard shows WhatsApp Mock Contract, WhatsApp Fake Webhook Runner, and Secret Manager Design as offline/design-only panels.
3. Confirm there is no WhatsApp API, webhook endpoint, HTTP listener, network call, QR login, token/cookie/session input, auto reply, Production connect, mutation, restart, or deploy button.
4. Confirm fake fixture reports are redacted and contain no real phone numbers or private chat.
# Sprint 28G WhatsApp Read-only Fake Provider Sandbox

Run:

```bash
node apps/dashboard/scripts/run-whatsapp-readonly-fake-provider-sandbox.mjs
node apps/dashboard/scripts/test-whatsapp-readonly-fake-provider-sandbox.mjs
```

Expected: `OpenClaw WhatsApp read-only fake provider sandbox tests passed.`

Confirm the dashboard shows `WhatsApp Read-only Fake Provider` with `providerMode: offline-fixture-only`, `readOnly true`, and all API/webhook/network/auth/send/reply/production flags disabled.
