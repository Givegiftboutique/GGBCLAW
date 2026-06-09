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
