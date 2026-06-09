# OpenClaw Dashboard Troubleshooting

Task: `TASK-20260609-OC-DASH-006`

## Dashboard Is Blank

1. Open browser developer tools and check for red console errors.
2. Confirm the local server is serving `apps/dashboard/index.html`.
3. Confirm the browser URL is `http://localhost:5173/` or a supported hash route.
4. Open `http://localhost:5173/?source=mock`.
5. Run `node apps/dashboard/verify-dashboard.mjs`.

Expected visible markers include `Overview`, `Agents`, `Tasks`, `Reviews`, `Logs`, `Backups`, `Settings`, `RBAC`, `Runbook`, `read-only`, and `mock-only`.

For gateway-stub mode, expected markers also include `gateway-stub`, `Production wiring`, and `disabled`.

## Source Validation Fails

1. Confirm the requested JSON file exists under `apps/dashboard`.
2. Run the local validator against the file.
3. Confirm required arrays and schema version are present.
4. Confirm no production endpoint, token-like assignment, cookie-like assignment, or password-like assignment is present.

The dashboard should fall back to mock data and show a fallback reason.

## Gateway-stub Validation Fails

1. Confirm every file exists under `apps/dashboard/data/gateway-stub/`.
2. Run the local quality gate.
3. Confirm fixture envelopes use `gateway-read-only-v1`, `safetyMode: read-only`, `mutationEnabled: false`, and `productionWiring: disabled`.
4. Confirm tasks include queued, running, review_pending, succeeded, failed, timed_out, cancelled, and lost.
5. Confirm there are 8 agents and every agent has role, responsibilities, allowed actions, denied actions, workspace scope, tool profile, and risk level.

Do not replace the fixture failure with a live gateway call.

## Generated Snapshot Is Missing

Run:

```bash
node apps/dashboard/scripts/generate-dashboard-snapshot.mjs
```

Then open:

```text
http://localhost:5173/?source=json&data=./data/generated/dashboard-export.generated.json
```

## Quality Gates Fail

1. Read `apps/dashboard/data/generated/quality-gate-report.json`.
2. Run `node apps/dashboard/scripts/safety-scan-dashboard.mjs`.
3. Run `node apps/dashboard/verify-dashboard.mjs`.
4. Fix only the reported scaffold, docs, or local data issue.

Do not connect production API, enable mutation, read secrets, or change deploy workflow while resolving Phase 06 issues.

## Odd Root-level Files Appear In Git

- Do not stage junk root files.
- Do not delete unrelated root-level files unless a separate cleanup task approves it.
- Run Git review commands in Git Bash or VS Code terminal if PowerShell cannot find Git.
- Suggested manual checks: `git status`, `git diff --stat`, and `git diff --name-only`.
