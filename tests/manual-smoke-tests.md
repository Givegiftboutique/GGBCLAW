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
