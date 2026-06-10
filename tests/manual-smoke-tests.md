# Manual Smoke Tests

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
