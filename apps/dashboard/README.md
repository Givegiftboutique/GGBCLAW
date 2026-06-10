# OpenClaw Dashboard - Internal Operator Beta

Status:

- Internal operator beta: allowed with review
- Production: no-go
- Safety mode: read-only
- Mutation enabled: false
- Production wiring: disabled

## Quick Start

```powershell
cd "C:\Users\marke\Documents\FOR GGB OPENCLAW\apps\dashboard"
python -m http.server 5173
```

Open:

```text
http://localhost:5173/?source=local-ingest#/dashboard
```

Source modes:

- `mock`
- `json`
- `artifact`
- `gateway-stub`
- `local-ingest`
- `dev-gateway`

Docs index:

```text
docs/dashboard/README.md
```

Final beta verification:

```bash
node apps/dashboard/scripts/generate-final-beta-audit.mjs
node apps/dashboard/scripts/verify-final-beta.mjs
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
node apps/dashboard/scripts/safety-scan-dashboard.mjs
node apps/dashboard/verify-dashboard.mjs
```

Final beta audit report:

```text
apps/dashboard/data/generated/final-beta-audit-report.json
```

Suggested final beta tag:

```text
v0.1.0-beta
```

Real local data pilot:

```bash
node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs
node apps/dashboard/scripts/test-real-local-data-pilot.mjs
```

Open generated real local snapshot:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
```

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

Open gateway-stub source:

```text
http://localhost:5173/?source=gateway-stub
```

Open local-ingest source:

```text
http://localhost:5173/?source=local-ingest
http://localhost:5173/?source=local-ingest&data=./data/local-ingest/local-dashboard-ingest.sample.json
```

Open dev-gateway source:

```text
http://localhost:5173/?source=dev-gateway
http://localhost:5173/?source=dev-gateway&baseUrl=http://localhost:8787
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
- `#/help`
- `#/dashboard/help`

## Data

- Typed data contract: `apps/dashboard/src/lib/mock-data.ts`
- Browser runtime mock data: `apps/dashboard/src/lib/mock-data.js`
- Read-only adapter layer: `apps/dashboard/src/lib/adapters/`
- Read-only gateway contract fixtures: `apps/dashboard/data/gateway-stub/`
- Local ingest samples: `apps/dashboard/data/local-ingest/`

The runtime copy exists so the dashboard can open directly without a build step. Keep both files aligned until a package manager and bundler are introduced.

The UI reads dashboard records through the adapter registry. Phase 03 adds local exported JSON and artifact manifest source adapters. These adapters read static local files only and fall back to the mock adapter when a source cannot be fetched or validated.

Phase 07 adds `?source=gateway-stub`. This source reads local gateway response fixtures, validates the read-only contract, maps the fixture envelope into the Dashboard data model, and displays `Data source: gateway-stub` with production wiring disabled.

Sprint 09A adds `?source=local-ingest` and `?source=dev-gateway`. Local ingest is JSON-only. Dev gateway is disabled unless a safe local `baseUrl` is explicitly provided, uses read-only GET, and omits credentials.

Sprint 11A adds a local RBAC stub and safe action draft previews. RBAC is simulated only and memory-only: no real login, no auth provider, no token, no cookie, no production permissions. Reviews, Backups, and Settings can generate JSON draft previews only; drafts are not submitted and include `dryRun: true`, `mutationEnabled: false`, `productionWiring: disabled`, `requiresHumanApproval: true`, and `notSubmitted: true`.

Sprint 12A adds an internal release workflow for local static handoff planning. It generates a release manifest and local release index, verifies local release readiness, and shows a read-only Release / Health panel. It does not deploy anything and does not add GitHub Actions or CI.

Sprint 15A adds Real Local Data Pilot and Snapshot Refresh Drill. It discovers local files, sanitizes unsafe values, generates `apps/dashboard/data/generated/real-local-dashboard-export.generated.json`, and loads it through `?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json`. It keeps absolute paths redacted, secrets redacted, production endpoints blocked, mutation disabled, and production wiring disabled.

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
- Safety mode
- Production wiring
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

## Gateway Contract Stub

Contract doc:

```text
docs/dashboard/openclaw-dashboard-gateway-contract.md
```

Fixture folder:

```text
apps/dashboard/data/gateway-stub/
```

Gateway-stub fixtures are local examples only. They do not perform a live network call, do not include secrets, and do not enable mutations.

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

## Gateway Contract Tests and Fixture Diff

Run local gateway-stub contract tests:

```bash
node apps/dashboard/scripts/test-gateway-contract.mjs
```

Run local ingest and dev gateway config tests:

```bash
node apps/dashboard/scripts/test-local-ingest.mjs
node apps/dashboard/scripts/test-dev-gateway-config.mjs
```

Run RBAC and action draft tests:

```bash
node apps/dashboard/scripts/test-rbac-policy.mjs
node apps/dashboard/scripts/generate-action-draft-samples.mjs
node apps/dashboard/scripts/test-action-drafts.mjs
```

Generated action draft sample:

```text
apps/dashboard/data/generated/action-drafts.sample.json
```

Run local release workflow checks:

```bash
node apps/dashboard/scripts/generate-release-manifest.mjs
node apps/dashboard/scripts/create-local-release-bundle.mjs
node apps/dashboard/scripts/verify-local-release.mjs
```

Run local observability and production readiness review:

```bash
node apps/dashboard/scripts/generate-observability-report.mjs
node apps/dashboard/scripts/test-observability.mjs
node apps/dashboard/scripts/generate-production-readiness-report.mjs
node apps/dashboard/scripts/test-production-readiness.mjs
```

Generated Sprint 14A records:

```text
apps/dashboard/data/generated/observability-report.json
apps/dashboard/data/generated/production-readiness-report.json
```

Observability is local-preview-only. It never sends webhook, email, Slack, or SMS alerts. Production readiness is internal-operator-beta review only and must keep recommendation `no-go-for-production`.

Release records:

```text
apps/dashboard/data/generated/release-manifest.json
apps/dashboard/release/local-release-index.json
```

Run fixture diff against the baseline:

```bash
node apps/dashboard/scripts/diff-gateway-fixtures.mjs
```

Regenerate the baseline only when intentionally changing gateway-stub fixtures:

```bash
node apps/dashboard/scripts/generate-gateway-contract-baseline.mjs
```

Then run the full quality gate:

```bash
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
```

Diff report:

```text
apps/dashboard/data/generated/gateway-fixture-diff-report.json
```

Breaking changes include missing fixture files, missing endpoint names, missing response sections, agent count not equal to 8, missing task lifecycle states, unsafe values, `mutationEnabled` not false, `safetyMode` not read-only, mapper output failing Dashboard validation, or source status missing production wiring disabled.

Do not regenerate the baseline just to hide a breaking change.

## Operator Runbook

Open the dashboard runbook route:

```text
http://localhost:5173/#/dashboard/help
```

Read the supporting Phase 06 operator docs:

- `docs/dashboard/openclaw-dashboard-operator-runbook.md`
- `docs/dashboard/openclaw-dashboard-troubleshooting.md`
- `docs/dashboard/openclaw-dashboard-release-checklist.md`

## Quick Acceptance Checklist

- Open `http://localhost:5173/`.
- Confirm Overview, Agents, Tasks, Reviews, Logs, Backups, Settings, RBAC, and Runbook are visible in the sidebar.
- Confirm Overview and Settings show Quality gate status.
- Confirm the source badge/status strip is readable.
- Confirm generated snapshot opens at `http://localhost:5173/?source=json&data=./data/generated/dashboard-export.generated.json`.
- Confirm gateway-stub opens at `http://localhost:5173/?source=gateway-stub`.
- Confirm gateway contract tests and fixture diff pass.
- Confirm local-ingest opens at `http://localhost:5173/?source=local-ingest`.
- Confirm dev-gateway without baseUrl falls back safely.
- Confirm RBAC route shows role matrix and permission matrix.
- Confirm simulated role switching is memory-only.
- Confirm Reviews, Backups, and Settings generate draft previews only.
- Confirm draft JSON shows dryRun true, mutationEnabled false, productionWiring disabled, requiresHumanApproval true, and notSubmitted true.
- Confirm Release / Health panel shows static-read-only mode, release manifest path, rollback tag suggestion, and disabled deploy controls.
- Confirm Observability route shows alert counts, local-preview-only mode, notificationSent false, and disabled external alert delivery.
- Confirm Production readiness summary shows production deploy false, internal-operator-beta scope, and recommendation no-go-for-production.
- Confirm Reviews controls are disabled or mock-only.
- Confirm Backups show evidence chain only.
- Confirm Settings stays read-only and says production mutation disabled.
- Confirm browser console has no red errors.

## Safety Warning

This scaffold is local-only and read-only. Do not connect production API, enable mutation, read secrets, change deploy workflow, or commit junk root files.

## Commit Checklist

Before committing, run:

```bash
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
node apps/dashboard/scripts/safety-scan-dashboard.mjs
node apps/dashboard/verify-dashboard.mjs
```

Then review Git status, diff stat, and changed file names in Git Bash or VS Code terminal if PowerShell cannot find Git.

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
