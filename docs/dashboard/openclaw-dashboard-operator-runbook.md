# OpenClaw Dashboard Operator Runbook

## Sprint 21C Single-agent Local Snapshot

Use the single-agent local-ingest URL when reviewing operator truth candidate data:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

The UI must show `Actual real agent count: 1`. The older real-local generated snapshot may show a review-required warning if it contains 5 agents. Do not treat mock or gateway-stub 8-agent fixtures as real inventory. Production remains `no-go-for-production`.

## Sprint 21B: Data Trust / 資料可信分類

`mock` and `gateway-stub` are fixture sources only. 8 agents are lifecycle / contract test fixtures, not real agents. `local-ingest` is the operator truth candidate and should be reviewed against the current single real agent expectation.

```bash
node apps/dashboard/scripts/generate-single-agent-truth-report.mjs
node apps/dashboard/scripts/generate-fixture-quarantine-report.mjs
node apps/dashboard/scripts/test-fixture-quarantine.mjs
```

Production still `no-go-for-production`; no production gateway connection is allowed.

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
- `local-ingest`: JSON-only local crawler, agent run, task memory, artifact, or dashboard export data.
- `dev-gateway`: read-only dev source for explicitly allowed local HTTP base URLs.
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

Open local-ingest mode:

```text
http://localhost:5173/?source=local-ingest
```

Open dev-gateway mode:

```text
http://localhost:5173/?source=dev-gateway&baseUrl=http://localhost:8787
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

## How To Run Gateway Contract Tests

```bash
node apps/dashboard/scripts/test-gateway-contract.mjs
```

Run local ingest and dev gateway config tests:

```bash
node apps/dashboard/scripts/test-local-ingest.mjs
node apps/dashboard/scripts/test-dev-gateway-config.mjs
```

Expected success:

```text
OpenClaw gateway stub contract tests passed.
```

## How To Run Fixture Diff

```bash
node apps/dashboard/scripts/diff-gateway-fixtures.mjs
```

Diff report:

```text
apps/dashboard/data/generated/gateway-fixture-diff-report.json
```

## When To Regenerate Gateway Baseline

Only regenerate the baseline after an intentional gateway-stub contract fixture update:

```bash
node apps/dashboard/scripts/generate-gateway-contract-baseline.mjs
```

Do not regenerate the baseline just to hide a breaking change.

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

## Gateway Fixture Diff Failure Response

- Read `apps/dashboard/data/generated/gateway-fixture-diff-report.json`.
- Treat missing fixture files, missing endpoint names, missing response sections, missing lifecycle states, unsafe values, mutation enabled, non-read-only safety mode, and missing production wiring disabled as breaking changes.
- Fix the fixture or mapper first.
- Regenerate baseline only for an intentional contract update.

## Dev Gateway Safety Response

- Missing `baseUrl` must not fetch.
- Unsafe base URLs must be blocked before fetch.
- Allowed examples are `http://localhost:8787` and `http://127.0.0.1:8787`.
- No credentials, no auth headers, no cookies, and no browser token storage are allowed.

## RBAC Simulation

- RBAC roles are simulated only: viewer, operator, reviewer, admin, and audit-only.
- The role selector is memory-only and must not write browser storage or cookies.
- This is not real login, not an auth provider, and not production authorization.
- No token, cookie, secret, or production permission handling is allowed.

Run:

```bash
node apps/dashboard/scripts/test-rbac-policy.mjs
```

## Safe Action Drafts

- Reviews can generate approve, reject, and needs changes drafts only.
- Backups can generate backup verification drafts only.
- Settings can generate settings change request drafts only.
- Drafts are JSON previews, not submitted operations.
- Every draft must keep dryRun true, mutationEnabled false, productionWiring disabled, requiresHumanApproval true, and notSubmitted true.

Run:

```bash
node apps/dashboard/scripts/generate-action-draft-samples.mjs
node apps/dashboard/scripts/test-action-drafts.mjs
```

## Internal Release Workflow

Sprint 12A adds local release metadata and operator handoff checks only.

```bash
node apps/dashboard/scripts/generate-release-manifest.mjs
node apps/dashboard/scripts/create-local-release-bundle.mjs
node apps/dashboard/scripts/verify-local-release.mjs
```

Review:

- `apps/dashboard/data/generated/release-manifest.json`
- `apps/dashboard/release/local-release-index.json`

The Dashboard Release / Health panel must show static-read-only mode, safety mode read-only, mutation enabled false, production wiring disabled, release manifest path, and rollback tag suggestion.

## Observability Preview

Sprint 14A adds local alert preview only.

```bash
node apps/dashboard/scripts/generate-observability-report.mjs
node apps/dashboard/scripts/test-observability.mjs
```

Review `apps/dashboard/data/generated/observability-report.json` and open `http://localhost:5173/?source=gateway-stub#/dashboard/observability`.

Confirm notification mode local-preview-only, notificationSent false, safety mode read-only, production wiring disabled, and mutation enabled false. Do not add webhook, email, Slack, SMS, or other external notification delivery.

## Production Readiness Review

Sprint 14A adds a checklist report for internal operator beta only.

```bash
node apps/dashboard/scripts/generate-production-readiness-report.mjs
node apps/dashboard/scripts/test-production-readiness.mjs
```

Review `apps/dashboard/data/generated/production-readiness-report.json`.

Production deploy must remain false and recommendation must remain no-go-for-production until real auth review, production Gateway security review, secrets plan, operator signoff, backup restore drill, incident response plan, and owner assignments are complete.

## Final Beta Audit

The final beta audit is the handoff layer for Internal Operator Beta.

```bash
node apps/dashboard/scripts/generate-final-beta-audit.mjs
node apps/dashboard/scripts/verify-final-beta.mjs
```

Review:

- `apps/dashboard/data/generated/final-beta-audit-report.json`
- `docs/dashboard/README.md`
- `docs/dashboard/openclaw-dashboard-repo-hygiene.md`
- `docs/dashboard/openclaw-dashboard-operator-handoff.md`

Suggested final beta tag is `v0.1.0-beta`. Production still no-go.

## Real Local Data Pilot

Sprint 15A adds local discovery, sanitization, snapshot generation, pilot report, and refresh drill.

```bash
node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs
node apps/dashboard/scripts/test-real-local-data-pilot.mjs
```

Open:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
```

Confirm absolute paths redacted, secrets redacted, production endpoints blocked, safety mode read-only, mutation enabled false, and production wiring disabled.

## Security / Privacy / Data Retention Audit

Sprint 19A adds local security/privacy audit, generated report sanitization, data retention review, and an operator security checklist. This is not legal compliance certification and does not approve production.

Run:

```bash
node apps/dashboard/scripts/generate-security-privacy-audit.mjs
node apps/dashboard/scripts/test-generated-report-sanitization.mjs
node apps/dashboard/scripts/generate-data-retention-review.mjs
node apps/dashboard/scripts/generate-operator-security-checklist.mjs
node apps/dashboard/scripts/test-security-privacy-audit.mjs
```

Review:

- `apps/dashboard/data/generated/security-privacy-audit-report.json`
- `apps/dashboard/data/generated/data-retention-review-report.json`
- `apps/dashboard/data/generated/operator-security-checklist.json`

Operator checks:

- generated reports must not contain secrets, private data, production endpoints, or absolute machine paths
- retention policy remains `draft-for-internal-review`
- production remains `no-go-for-production`
- safety mode remains `read-only`, `mutationEnabled: false`, and `productionWiring: disabled`

## v1.0.0 Internal Release Candidate

Sprint 20A prepares `v1.0.0-internal-rc1` and a manual sign-off package. The generated package is not approval.

```bash
node apps/dashboard/scripts/generate-internal-release-candidate.mjs
node apps/dashboard/scripts/generate-internal-signoff-package.mjs
node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs
node apps/dashboard/scripts/test-internal-release-candidate.mjs
```

Confirm the UI shows `signoffStatus pending`, `manualSignoffRequired true`, `notApprovedYet true`, `read-only`, `mutationEnabled false`, `productionWiring disabled`, and `no-go-for-production`.

## Sprint 21A Production Track Planning

Run:

```bash
node apps/dashboard/scripts/generate-production-track-plan.mjs
node apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs
node apps/dashboard/scripts/generate-production-entry-gates.mjs
node apps/dashboard/scripts/test-production-track-planning.mjs
```

Confirm the UI shows:

- Production Track Planning / Production route planning.
- `v1.0.0-internal`.
- `productionStatus no-go-for-production`.
- `productionTrackStatus planning-only`.
- `gatewayConnectionStatus not-connected`.
- `readinessStatus not-ready`.
- `entryGateStatus blocked`.
- Fixture Quarantine + Single Agent Truth Alignment.

Operator reality note: the current real operator environment is expected to have only 1 real agent. Existing 8-agent data is mock / fixture / gateway-stub lifecycle test data only and must not be treated as operator truth.

## Odd Root-level Files Response

- Leave unrelated root-level files untouched.
- Do not stage junk root files.
- Do not delete or rewrite unknown files without a separate cleanup request.
- Mention odd files in the task record if they affect manual Git review.

## What Not To Do

- do not connect production API
- do not enable mutation
- do not read secrets
- do not add real login, token handling, or cookie handling
- do not submit action drafts
- do not run production deploy
- do not add GitHub Actions or CI
- do not commit junk root files
- do not modify deploy workflow
## Sprint 21D Operator Source Selection Lockdown

Recommended operator URL:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

Before trusting agent inventory, confirm the source badge and use the single-agent truth candidate. `mock` and `gateway-stub` are high-warning fixture sources only. If 8 agents are visible, do not treat them as real operator inventory. Production still no-go.
## Sprint 22A local real agent health

- Generate report: `node apps/dashboard/scripts/generate-local-real-agent-health-report.mjs`
- Generate checklist: `node apps/dashboard/scripts/generate-operator-agent-health-checklist.mjs`
- Review report: `apps/dashboard/data/generated/local-real-agent-health-report.json`
- Health source: `local-file-only`
- expected real agent count = 1.
- If health is `unknown`, perform local operator review.
- If health is `stale`, use manual runbook outside the Dashboard.
- no restart, no stop/start, no mutation, production still no-go.
## Sprint 22B Reviewed Local Health Intake

- Copy `apps/dashboard/data/local/reviewed-local-agent-health.example.json` to `apps/dashboard/data/local/reviewed-local-agent-health.json` only after local sanitization.
- Confirm `expectedAgentCount = 1`, `agents.length = 1`, `productionReady = false`, and all safety flags disable remote fetch, restart, mutation, and production gateway connection.
- If validation fails, the generated report falls back to `local-file-only` and marks review-required.
- The Dashboard must not print secret values and must never restart / stop / start the agent.
