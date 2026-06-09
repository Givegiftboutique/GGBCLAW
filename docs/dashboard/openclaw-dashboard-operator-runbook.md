# OpenClaw Dashboard Operator Runbook

Task: `TASK-20260609-OC-DASH-006`

This runbook supports local manual acceptance for the read-only OpenClaw Dashboard scaffold.

## What This Dashboard Is

- A mock-only local dashboard for reviewing OpenClaw agent operations.
- A static browser surface for agents, tasks, reviews, logs, backups, settings, RBAC, source status, and quality gate status.
- A safe acceptance tool for local JSON, artifact, and generated snapshot data.

## What This Dashboard Is Not

- It is not a live gateway client.
- It is not an authentication or authorization backend.
- It is not a mutation console.
- It does not run real approve, reject, backup, restore, import, export, settings, task delete, or task cancel operations.

## Safe Operating Rules

- Keep production mutations disabled.
- Keep all controls read-only or mock-only.
- Use local/static data sources only.
- Do not connect production API.
- Do not enable mutation.
- Do not read secrets.
- Do not change deploy workflow.
- Do not commit junk root files.

## Data Sources

- `mock`: in-memory scaffold records from `apps/dashboard/src/lib/mock-data.js`.
- `json`: local static dashboard export JSON.
- `artifact`: local artifact manifest that points to static local files.
- `gateway-stub`: local read-only Gateway contract fixtures under `apps/dashboard/data/gateway-stub/`.
- Generated snapshot: `apps/dashboard/data/generated/dashboard-export.generated.json`.

## How To Run Local Server

Windows PowerShell:

```powershell
cd "C:\Users\marke\Documents\FOR GGB OPENCLAW\apps\dashboard"
python -m http.server 5173
```

Open:

```text
http://localhost:5173/
```

Open gateway-stub mode:

```text
http://localhost:5173/?source=gateway-stub
```

If Python is unavailable, use VS Code Live Server on the `apps/dashboard` folder.

## How To Run Quality Gates

From the repository root:

```bash
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
```

The quality report is written to:

```text
apps/dashboard/data/generated/quality-gate-report.json
```

## How To Generate Snapshot

```bash
node apps/dashboard/scripts/generate-dashboard-snapshot.mjs
```

## How To Validate Snapshot

```bash
node apps/dashboard/scripts/validate-dashboard-snapshot.mjs apps/dashboard/data/generated/dashboard-export.generated.json
```

## Blank Dashboard Response

- Check the browser console for script errors.
- Confirm `index.html` loads adapter scripts before `app.js`.
- Open `http://localhost:5173/?source=mock` first.
- Open `http://localhost:5173/?source=gateway-stub` to confirm local Gateway fixtures validate.
- Confirm `#/dashboard` and `#/dashboard/help` render visible content.

## Source Validation Failure Response

- Validate the file with the local snapshot validator.
- Confirm the file matches `dashboard-export-v1`.
- Confirm no production endpoint or secret-like value is present.
- Fallback to mock data is expected when local source validation fails.

## Odd Root-level Files Response

- Leave unrelated root-level files untouched.
- Do not stage junk root files.
- Do not delete or rewrite unknown files without a separate cleanup request.
- Mention odd files in the task record if they affect manual Git review.

## What Not To Do

- do not connect production API
- do not enable mutation
- do not read secrets
- do not commit junk root files
- do not modify deploy workflow
