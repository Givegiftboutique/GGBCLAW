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

## Expected Result

All dashboard routes are reachable, mock data is visible, no production endpoint is called, and no secret-like values are displayed.
