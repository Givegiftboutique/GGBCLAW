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

The runtime copy exists so the dashboard can open directly without a build step. Keep both files aligned until a package manager and bundler are introduced.

## Verification

Use the bundled or locally available Node runtime:

```powershell
node apps/dashboard/verify-dashboard.mjs
node --check apps/dashboard/src/app.js
node --check apps/dashboard/src/lib/mock-data.js
```

No production OpenClaw endpoint, secret reference, deploy workflow, backup restore, or mutation action is wired in this scaffold.

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
