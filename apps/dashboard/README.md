# OpenClaw Dashboard Scaffold

Task: `TASK-20260609-OC-DASH-001`

Open `apps/dashboard/index.html` in a browser to view the read-only scaffold.

If your browser or test harness blocks `file://` pages, run a local static server instead.

Windows PowerShell:

```powershell
cd "C:\Users\marke\Documents\FOR GGB OPENCLAW\apps\dashboard"
python -m http.server 5173
```

Then open:

```text
http://localhost:5173/
```

Open mock source:

```text
http://localhost:5173/?source=mock
```

Open JSON source:

```text
http://localhost:5173/?source=json
```

Open artifact source:

```text
http://localhost:5173/?source=artifact
```

Open custom local JSON file:

```text
http://localhost:5173/?source=json&data=./data/dashboard-export.sample.json
```

If Python is not available, use VS Code Live Server on the `apps/dashboard` folder and open the local URL it provides.

## Routes

The static scaffold uses hash-backed route navigation:

- `#/dashboard`
- `#/agents`
- `#/dashboard/agents`
- `#/tasks`
- `#/dashboard/tasks`
- `#/reviews`
- `#/dashboard/reviews`
- `#/logs`
- `#/dashboard/logs`
- `#/backups`
- `#/dashboard/backups`
- `#/settings`
- `#/dashboard/settings`
- `#/rbac`
- `#/dashboard/rbac`

## Data

- Typed data contract: `apps/dashboard/src/lib/mock-data.ts`
- Browser runtime mock data: `apps/dashboard/src/lib/mock-data.js`
- Read-only adapter layer: `apps/dashboard/src/lib/adapters/`

The runtime copy exists so the dashboard can open directly without a build step. Keep both files aligned until a package manager and bundler are introduced.

The UI reads dashboard records through the adapter registry. Phase 03 adds local exported JSON and artifact manifest source adapters. These adapters read static local files only and fall back to the mock adapter when a source cannot be fetched or validated.

## Verification

Use the bundled or locally available Node runtime:

```powershell
node apps/dashboard/verify-dashboard.mjs
node --check apps/dashboard/src/app.js
node --check apps/dashboard/src/lib/mock-data.js
```

No production OpenClaw endpoint, secret reference, deploy workflow, backup restore, or mutation action is wired in this scaffold.

No adapter exposes active approve, reject, backup, restore, settings update, task delete, or task cancel methods.

## Source Status

The dashboard displays:

- Data source
- Health
- Validation
- Fallback
- Fallback reason
- Last loaded

## Snapshot Generator

Generate a local read-only dashboard snapshot:

```bash
node apps/dashboard/scripts/generate-dashboard-snapshot.mjs
```

Validate the generated snapshot:

```bash
node apps/dashboard/scripts/validate-dashboard-snapshot.mjs apps/dashboard/data/generated/dashboard-export.generated.json
```

Open generated snapshot:

```text
http://localhost:5173/?source=json&data=./data/generated/dashboard-export.generated.json
```

The dashboard also shows a read-only `Import / Export Contract` section. Import is disabled in the scaffold, and export is local-script only.

## One-command Quality Gate

From the repository root:

```bash
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
```

From the dashboard folder:

```bash
cd apps/dashboard
node scripts/run-dashboard-quality-gates.mjs
```

Windows PowerShell from the repository root:

```powershell
cd "C:\Users\marke\Documents\FOR GGB OPENCLAW"
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
```

The quality gate writes:

```text
apps/dashboard/data/generated/quality-gate-report.json
```

Run the standalone safety scan:

```bash
node apps/dashboard/scripts/safety-scan-dashboard.mjs
```

## Visual Fix Note

`TASK-20260609-OC-DASH-001-VISUAL-FIX` fixed a classic-script global scope collision between `mock-data.js` and `app.js`. Both scripts now run in private scopes and only expose the intended `window.OpenClawMockData` handoff.

## Git Check

If Git is unavailable in this PowerShell session, run these commands manually in Git Bash or the VS Code terminal:

```bash
git --version
git status
git diff --stat
git diff --name-only
```

Suggested commit message:

```text
feat(dashboard): add OpenClaw agent operations dashboard scaffold
```
