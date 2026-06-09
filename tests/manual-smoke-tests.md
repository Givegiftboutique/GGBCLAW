# Manual Smoke Tests

## OpenClaw Dashboard Scaffold

Task: `TASK-20260609-OC-DASH-001`

1. Open `apps/dashboard/index.html` in a browser. If `file://` is blocked, run `python -m http.server 5173` from `apps/dashboard` and open `http://localhost:5173/`.
2. Confirm the sidebar shows Overview, Agents, Tasks, Reviews, Logs, Backups, Settings, and RBAC.
3. Select each navigation item and confirm the page content changes without a reload.
4. Confirm these direct routes render: `#/dashboard`, `#/agents`, `#/tasks`, `#/reviews`, `#/logs`, `#/backups`, `#/settings`, `#/rbac`.
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
5. Open an invalid local source path, such as `http://localhost:5173/?source=json&data=./data/missing.json`, and confirm the dashboard falls back to mock with a warning.
6. Confirm the source badge and validation status are visible.
7. Confirm the browser console has no red errors.
8. Confirm all routes remain reachable.
9. Confirm Reviews remain disabled/mock-only.
10. Confirm Backups remain evidence-only with no real backup or restore action.
11. Confirm Settings remain read-only and production mutation disabled.
