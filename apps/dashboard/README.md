# OpenClaw Dashboard - Internal Operator Beta

## Sprint 28B: WhatsApp Local Task Helper

Sprint 28B adds a local-only helper for operators who want to prepare cleaned WhatsApp task blocks before importing them into the Dashboard.

Templates:

```text
apps/dashboard/data/local/whatsapp-task-helper-input.template.txt
apps/dashboard/data/local/whatsapp-task-helper-input.example.txt
```

Run:

```powershell
.\apps\dashboard\scripts\build-whatsapp-local-task-import.ps1 -Input "apps/dashboard/data/local/whatsapp-task-helper-input.txt"
```

The real helper input and generated import JSON are ignored. Do not commit raw chat, phone numbers, passwords, API keys, tokens, cookies, Authorization values, or credentials.

No WhatsApp API, webhook, QR login, browser session/cookie read, auto-reply, Production connection, mutation, restart, or deploy is added.

## Sprint 27A: Safe Task Metadata Discovery

Sprint 27A adds a schema-only discovery tool for local WSL OpenClaw task metadata. It only inspects SQLite table and column names, then classifies columns as safe candidates, forbidden, or review-required.

Report:

```text
apps/dashboard/data/generated/wsl-openclaw-task-metadata-schema-discovery-report.json
```

Run:

```powershell
node apps/dashboard/scripts/discover-wsl-openclaw-task-metadata-schema.mjs --distro Ubuntu-24.04 --state-dir "<WSL_OPENCLAW_STATE_DIR>" --dry-run
```

This sprint does not display task rows. Prompt, message, content, body, input, output, response, token, credential, and secret-like fields remain blocked. Production remains `no-go-for-production`; no mutation, restart, deploy, auth, or Production gateway is added.

## Sprint 26G: WSL Local OpenClaw Safe Export Adapter

Sprint 26G adds a separate read-only adapter for local OpenClaw running in WSL. It does not modify installed OpenClaw runtime files. It reads safe state metadata and can write the ignored local export:

```text
apps/dashboard/data/local/openclaw-local-export.json
```

The redacted report is:

```text
apps/dashboard/data/generated/wsl-openclaw-local-export-adapter-report.json
```

Dry run:

```powershell
.\apps\dashboard\scripts\generate-openclaw-local-export-from-wsl.ps1 -Distro "Ubuntu-24.04" -StateDir "<WSL_OPENCLAW_STATE_DIR>" -DryRun
```

Real local export files remain ignored and must not be committed. The adapter skips raw prompt/session/message/content/body/input/output fields. Production remains `no-go-for-production`; no production API/Gateway, auth/token input, mutation, restart, or deploy is added.

## Sprint 26A: Local OpenClaw Read-only Connector MVP

Sprint 26A adds a local-only read-only connector candidate for local OpenClaw. It only accepts localhost / 127.0.0.1 and GET reads, and it generates:

```text
apps/dashboard/data/generated/local-openclaw-connector-report.json
```

Local config is optional and ignored:

```text
apps/dashboard/data/local/local-openclaw-connector.json
```

If no local connector config or endpoint exists, the Dashboard shows "本機 OpenClaw 未連接" and explains that this is setup-needed, not a Dashboard failure. Production remains `no-go-for-production`; no production Gateway, endpoint input, auth input, credential, mutation, restart, or deploy is added.

## Sprint 26D: Local OpenClaw Read-only Export Bridge

Sprint 26D adds a local export bridge report and real bridge smoke test. The Dashboard now explains the health-only case clearly: local OpenClaw may respond on `/health`, while Agent/task counts stay zero until `/api/local/export`, `/api/local/agents`, `/api/local/tasks`, or a reviewed local export file exists.

Report:

```text
apps/dashboard/data/generated/openclaw-local-export-bridge-report.json
```

Real local export files remain ignored and must not be committed:

```text
apps/dashboard/data/local/openclaw-local-export.json
```

Production remains `no-go-for-production`; no production API/Gateway, auth/token input, endpoint input, mutation, restart, deploy, provider login, WhatsApp API, or secrets are added.

## Sprint 25C: Operator UX + Task Visibility + Hourly Refresh + Balance Center

Sprint 25C improves the local operator first screen for non-engineering users. It adds clear Chinese panels for 今日任務, Agent 狀態, 用量與餘額, 最後刷新, Production 安全鎖, and 已知風險.

Reports:

```text
apps/dashboard/data/generated/local-task-inbox-report.json
apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json
apps/dashboard/data/generated/hourly-refresh-policy-report.json
apps/dashboard/data/generated/provider-balance-center-report.json
```

Local-only inputs are ignored and must not be committed:

```text
apps/dashboard/data/local/operator-task-inbox.json
apps/dashboard/data/local/provider-balance-center.json
```

WhatsApp tasks only appear after a safe local task inbox export exists. The balance center is manual/local-only and does not store sensitive sign-in data or API credentials. Production remains `no-go-for-production`; production gateway, mutation, restart, deploy, endpoint input, and sign-in credential input remain disabled.

## Sprint 25B: Final Local Operator Release Candidate Audit

Sprint 25B adds the final local operator release candidate audit. It is a local-only checkpoint for daily Dashboard use, not production approval.

Reports:

```text
apps/dashboard/data/generated/local-operator-release-candidate-report.json
apps/dashboard/data/generated/local-operator-final-checklist.json
apps/dashboard/data/generated/local-operator-known-risk-register.json
apps/dashboard/data/generated/local-operator-report-index.json
```

Run:

```bash
node apps/dashboard/scripts/run-local-operator-rc-audit.mjs
node apps/dashboard/scripts/test-local-operator-rc-audit.mjs
```

Required state: `productionReady false`, `adapterEnabled false`, `connected false`, `endpointConfigured false`, `authEnabled false`, `dataReturned false`. Production remains `no-go-for-production`; no production Gateway, endpoint, sign-in credential input, mutation, restart, deploy, or CI is added.

## Sprint 25A: Read-only Adapter Contract + Disabled Draft

Sprint 25A adds a read-only adapter contract review, a disabled read-only production adapter draft, and a dashboard stabilization audit. These are planning artifacts only; no production adapter is enabled.

Reports:

```text
apps/dashboard/data/generated/read-only-adapter-contract-review-report.json
apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json
apps/dashboard/data/generated/read-only-adapter-contract-checklist.json
apps/dashboard/data/generated/dashboard-stabilization-audit-report.json
```

Run:

```bash
node apps/dashboard/scripts/generate-read-only-adapter-contract-review-report.mjs
node apps/dashboard/scripts/generate-disabled-read-only-adapter-draft-report.mjs
node apps/dashboard/scripts/generate-read-only-adapter-contract-checklist.mjs
node apps/dashboard/scripts/generate-dashboard-stabilization-audit-report.mjs
node apps/dashboard/scripts/test-read-only-adapter-contract-and-draft.mjs
```

Required state: `productionReady false`, `adapterEnabled false`, `connected false`, `endpointConfigured false`, `authEnabled false`, `dataReturned false`. Production remains `no-go-for-production`; no endpoint, sign-in credential input, production gateway, mutation, restart, deploy, or CI is added.

## Sprint 24B: Read-only Production Adapter Simulator

Sprint 24B adds a disabled read-only production adapter simulator for future planning only.

Reports:

```text
apps/dashboard/data/generated/production-adapter-simulator-report.json
apps/dashboard/data/generated/production-adapter-simulator-checklist.json
```

Run:

```bash
node apps/dashboard/scripts/generate-production-adapter-simulator-report.mjs
node apps/dashboard/scripts/generate-production-adapter-simulator-checklist.mjs
node apps/dashboard/scripts/test-production-adapter-simulator.mjs
```

The simulator keeps `productionReady false`, `adapterEnabled false`, `connected false`, `endpointConfigured false`, `authEnabled false`, and `simulatorOnly true`. It does not connect production, mutate, restart, deploy, or handle auth/token/cookie/secrets.

## Sprint 22C: Local Health Evidence Review

Sprint 22C adds a local health evidence review pack for the sanitized local health intake.

Reports:

```text
apps/dashboard/data/generated/local-health-evidence-review-report.json
apps/dashboard/data/generated/operator-local-health-evidence-checklist.json
```

Run:

```bash
node apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs
node apps/dashboard/scripts/generate-operator-local-health-evidence-checklist.mjs
node apps/dashboard/scripts/test-local-health-evidence-review.mjs
```

Evidence statuses include `reviewed-valid`, `missing-fallback`, `reviewed-invalid-fallback`, `sample-fallback`, `review-required`, and `unsafe-rejected`. Redaction is applied and raw values are never printed. No restart, no mutation, no production gateway. Production still no-go.

## Sprint 21C: Single-agent Local Snapshot

`local-ingest` operator truth candidate now has a dedicated single-agent snapshot:

```text
apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json
```

Open:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

Run:

```bash
node apps/dashboard/scripts/inspect-real-local-agent-inventory.mjs
node apps/dashboard/scripts/generate-single-agent-local-snapshot.mjs
node apps/dashboard/scripts/generate-single-agent-truth-report.mjs --data apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json
node apps/dashboard/scripts/test-single-agent-local-snapshot.mjs
```

The old generated real local snapshot may contain 5 agents and must be treated as review evidence only. `mock` and `gateway-stub` still keep 8 fixture agents for lifecycle and contract tests. Production remains `no-go-for-production`.

## Sprint 21B: Fixture Quarantine + Single Agent Truth

`mock` and `gateway-stub` data are fixture/demo sources only. 8 agents are fixture only and must not be treated as real operator inventory. The current real operator assumption is 1 real agent.

`local-ingest` is the operator truth candidate after validation and human review.

```bash
node apps/dashboard/scripts/generate-single-agent-truth-report.mjs
node apps/dashboard/scripts/generate-fixture-quarantine-report.mjs
node apps/dashboard/scripts/test-fixture-quarantine.mjs
```

Reports:

- `apps/dashboard/data/generated/single-agent-truth-report.json`
- `apps/dashboard/data/generated/fixture-quarantine-report.json`

Production remains `no-go-for-production`.

Status:

- Internal operator beta: allowed with review
- 內部 Operator Beta：可在人工審核下使用
- Production: no-go
- Production 暫不可上線
- Safety mode: read-only
- Mutation enabled: false
- Production wiring: disabled

## v1.0.0 Internal Release Candidate

Status:

- Internal Release Candidate: `v1.0.0-internal-rc1`
- Final internal tag after manual sign-off: `v1.0.0-internal`
- Sign-off status: `pending`
- Manual sign-off required: true
- Production: `no-go-for-production`
- Safety mode: `read-only`
- `mutationEnabled false`
- `productionWiring disabled`

Run:

```bash
node apps/dashboard/scripts/generate-internal-release-candidate.mjs
node apps/dashboard/scripts/generate-internal-signoff-package.mjs
node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs
node apps/dashboard/scripts/test-internal-release-candidate.mjs
```

Reports:

```text
apps/dashboard/data/generated/internal-release-candidate-report.json
apps/dashboard/data/generated/internal-signoff-package.json
```

Do not auto-approve sign-off. Do not mark production ready.

## Sprint 21A Production Track Planning

Status:

- Current release: `v1.0.0-internal`
- Production status: `no-go-for-production`
- Production track status: `planning-only`
- Gateway connection status: `not-connected`
- Readiness status: `not-ready`
- Entry gate status: `blocked`

Reality alignment blocker:

- Current real operator environment is expected to have only 1 real agent.
- Existing 8-agent data is mock / fixture / gateway-stub lifecycle test data only.
- Production track must not assume 8 real agents.
- Future prerequisite: Fixture Quarantine + Single Agent Truth Alignment before any read-only production gateway implementation.

Run:

```bash
node apps/dashboard/scripts/generate-production-track-plan.mjs
node apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs
node apps/dashboard/scripts/generate-production-entry-gates.mjs
node apps/dashboard/scripts/test-production-track-planning.mjs
```

Reports:

```text
apps/dashboard/data/generated/production-track-plan-report.json
apps/dashboard/data/generated/readonly-production-gateway-readiness-report.json
apps/dashboard/data/generated/production-entry-gates-report.json
```

Do not connect production Gateway. Do not mark production ready.

## Quick Start

## 快速開始

```powershell
cd "C:\Users\marke\Documents\FOR GGB OPENCLAW\apps\dashboard"
python -m http.server 5173
```

打開：

```text
http://localhost:5173/?source=local-ingest#/dashboard
```

資料來源模式（source mode values 保留原文）：

資料來源模式：source mode values 保持原文，不要翻譯或改名。

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

## Dev Gateway Read-only Live Drill

本機 dev gateway 演練只可連到 localhost fixture server，不可連 production。

```bash
node apps/dashboard/scripts/start-dev-gateway-fixture-server.mjs --port 8787
node apps/dashboard/scripts/run-dev-gateway-live-drill.mjs
node apps/dashboard/scripts/test-dev-gateway-live-drill.mjs
```

Report path:

```text
apps/dashboard/data/generated/dev-gateway-live-drill-report.json
```

Browser URL:

```text
http://localhost:5173/?source=dev-gateway&baseUrl=http://localhost:8787
```

Safety markers: `credentials: "omit"`, no Authorization header, no cookie/token handling, `mutationEnabled false`, `productionWiring disabled`.

## Operator Daily Workflow

```bash
node apps/dashboard/scripts/run-operator-daily-workflow.mjs
node apps/dashboard/scripts/run-operator-incident-drill.mjs
node apps/dashboard/scripts/generate-operator-evidence-manifest.mjs
```

Reports:

```text
apps/dashboard/data/generated/operator-daily-summary.json
apps/dashboard/data/generated/operator-incident-drill-report.json
apps/dashboard/data/generated/operator-evidence-manifest.json
```

Safety: local evidence only, `read-only`, `mutationEnabled false`, `productionWiring disabled`, `notificationSent false`, production remains `no-go-for-production`.

## Internal Static Hosting Dry Run

Sprint 18A adds a local/static preview and access checklist for internal hosting review only. It is not a production deploy.

```bash
node apps/dashboard/scripts/start-internal-static-preview.mjs --port 5180
node apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs
node apps/dashboard/scripts/generate-operator-access-checklist.mjs
node apps/dashboard/scripts/test-internal-static-hosting.mjs
```

Reports:

```text
apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json
apps/dashboard/data/generated/operator-access-checklist.json
```

Preview URLs:

```text
http://127.0.0.1:5180/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
http://127.0.0.1:5180/?source=gateway-stub#/dashboard/help
http://127.0.0.1:5180/?source=gateway-stub#/dashboard/observability
```

Safety: `read-only`, `mutationEnabled false`, `productionWiring disabled`, `productionDeploy false`, production remains `no-go-for-production`.

## Security / Privacy / Data Retention Audit

Sprint 19A adds internal beta security, privacy, generated report sanitization, and data retention review. This is not a legal compliance certification.

```bash
node apps/dashboard/scripts/generate-security-privacy-audit.mjs
node apps/dashboard/scripts/test-generated-report-sanitization.mjs
node apps/dashboard/scripts/generate-data-retention-review.mjs
node apps/dashboard/scripts/generate-operator-security-checklist.mjs
node apps/dashboard/scripts/test-security-privacy-audit.mjs
```

Reports:

```text
apps/dashboard/data/generated/security-privacy-audit-report.json
apps/dashboard/data/generated/data-retention-review-report.json
apps/dashboard/data/generated/operator-security-checklist.json
```

Safety: `read-only`, `mutationEnabled false`, `productionWiring disabled`, production remains `no-go-for-production`, retention policy is `draft-for-internal-review`.

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

## Sprint 21D Operator Source Selection Lockdown

Operator recommended URL:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

Use this single-agent truth candidate before treating agent inventory as operator truth. `mock` and `gateway-stub` remain available only as explicit fixture/demo sources with high warning banners. If you see 8 agents, treat them as fixture-only lifecycle / contract coverage, not real agents. Production still no-go.

Reports:

```text
apps/dashboard/data/generated/operator-source-lockdown-report.json
apps/dashboard/data/generated/operator-source-selection-checklist.json
```

Commands:

```bash
node apps/dashboard/scripts/generate-operator-source-lockdown-report.mjs
node apps/dashboard/scripts/generate-operator-source-selection-checklist.mjs
node apps/dashboard/scripts/test-operator-source-lockdown.mjs
```

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
## Sprint 22A Local Real Agent Health

- local real agent health: local-file-only read-only health candidate.
- Report path: `apps/dashboard/data/generated/local-real-agent-health-report.json`
- Checklist path: `apps/dashboard/data/generated/operator-agent-health-checklist.json`
- Command: `node apps/dashboard/scripts/generate-local-real-agent-health-report.mjs`
- Health statuses: `online`, `stale`, `unknown`, `review-required`.
- expected real agent count = 1.
- no restart, no stop/start, no mutation, no production gateway.
- production still no-go.

## Sprint 22B - Sanitized Local Health JSON Intake

- Reviewed example: `apps/dashboard/data/local/reviewed-local-agent-health.example.json`
- Optional local-only reviewed input: `apps/dashboard/data/local/reviewed-local-agent-health.json`
- Valid reviewed input sets `healthSource = local-reviewed-json`.
- Missing or invalid reviewed input falls back to `healthSource = local-file-only` and review-required follow-up.
- The intake rejects API key, token, cookie, secret, password, Authorization, bearer, credential, privateKey, accessToken, and refreshToken fields without printing values.
- Production remains `no-go-for-production`; restart, mutation, remote fetch, and production gateway connection remain disabled.

## Sprint 23A Operator Usability MVP

Start the daily operator view from repo root:

```powershell
.\apps\dashboard\scripts\start-operator-dashboard.ps1
```

Recommended operator URL:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

Operators should see Operator Home, 1 real agent, local health, local health evidence review, `productionStatus: no-go-for-production`, restart disabled, mutation disabled, and production gateway disabled. If 8 agents appear, the source is fixture/demo data and not the daily operator view.

Reports:

```text
apps/dashboard/data/generated/operator-daily-usability-checklist.json
apps/dashboard/data/generated/operator-usability-troubleshooting-report.json
```

## Sprint 23B Daily Operator Runbook Mode

Daily runbook mode adds a status panel after Operator Home:

- `OK`
- `Review Required`
- `Blocked`
- `Fixture Mode`
- `Unknown`

Reports:

```text
apps/dashboard/data/generated/daily-operator-summary-report.json
apps/dashboard/data/generated/daily-operator-runbook-checklist.json
```

Run:

```bash
node apps/dashboard/scripts/generate-daily-operator-summary-report.mjs
node apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs
node apps/dashboard/scripts/test-daily-operator-runbook.mjs
```

Daily runbook mode keeps the recommended source as `local-ingest` with the single-agent snapshot. `mock` and `gateway-stub` remain fixture mode only. Restart, mutation, production gateway, deploy, auth, token, cookie, and secrets handling remain disabled; production remains `no-go-for-production`.
## Sprint 23C Reviewed Health Input Assistant

Sprint 23C adds a local-only reviewed health input assistant. Operators copy `apps/dashboard/data/local/reviewed-local-agent-health.template.json` to the ignored local file `apps/dashboard/data/local/reviewed-local-agent-health.json`, run the dry-run validator, and only then regenerate local health reports.

Generated reports:

- `apps/dashboard/data/generated/reviewed-local-health-input-template-report.json`
- `apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json`
- `apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json`

The real reviewed input is local-only and must not be committed. The dry-run report applies redaction and never prints raw reviewed values. Production remains `no-go-for-production`; restart, mutation, deploy, auth, secrets, and production gateway remain disabled.

## Sprint 24A - Production Entry Gate Hardening

Sprint 24A adds a local-only Production Entry Gate panel, report, and checklist. Reports live at `apps/dashboard/data/generated/production-entry-gate-report.json` and `apps/dashboard/data/generated/production-entry-gate-checklist.json`. `productionReady` remains `false`, production remains `no-go-for-production`, and production gateway / mutation / restart / deploy / auth-token-use remain disabled.

## Sprint 25D: Chinese-first Operator UX Copy Hardening

Sprint 25D changes the main Dashboard copy from engineering labels into Chinese-first operator wording. Raw enum values and technical keys remain available for review, but are moved into collapsed `技術詳情` sections so daily users see clear next steps first.

Docs: `docs/dashboard/openclaw-dashboard-chinese-operator-ux-copy-hardening.md`

Production remains `no-go-for-production`; production gateway, endpoint input, sign-in credential input, mutation, restart, deploy, provider external account access, WhatsApp API, and secrets remain disabled or forbidden.

## Sprint 25E: Operator Console Visual Redesign

Sprint 25E redesigns the Dashboard as a modern Chinese-first operator console. The home page is now a command center, tasks are shown as work queue cards, Agent status is shown as operator cards, Reviews/RBAC explain safe simulation, and Balance / Refresh panels are card-based. Technical values remain available only in collapsed technical details.

Docs: `docs/dashboard/openclaw-dashboard-operator-console-visual-redesign.md`

Production remains `no-go-for-production`; no production gateway, endpoint input, sign-in credential input, mutation, restart, deploy, provider external account access, WhatsApp API, or secrets are added.

## Sprint 26A / 26B: Local OpenClaw Read-only Connector and Activation

Sprint 26A adds `apps/dashboard/data/generated/local-openclaw-connector-report.json` for local-only read-only OpenClaw status, agents, and tasks. Sprint 26B adds the activation assistant and `apps/dashboard/data/generated/local-openclaw-activation-report.json`.

Operators may use either localhost read-only endpoint setup or the local export file path `apps/dashboard/data/local/openclaw-local-export.json`. Real files `local-openclaw-connector.json` and `openclaw-local-export.json` are local-only, ignored by git, and must not be committed.

## Sprint 26D: Local OpenClaw Read-only Export Bridge

Sprint 26D adds `apps/dashboard/data/generated/openclaw-local-export-bridge-report.json` and `apps/dashboard/scripts/test-local-openclaw-real-bridge.mjs`. If local OpenClaw only exposes `/health`, Dashboard shows that the service responded but has not provided an Agent/task list yet. Real non-zero counts require a localhost-only GET JSON export endpoint or a reviewed ignored local export file.

No API key, password, token, auth input, external API, Production Gateway, mutation, restart, stop, start, or deploy behavior is added.

## Sprint 28A: WhatsApp Local Task Import

Sprint 28A adds `apps/dashboard/data/generated/whatsapp-local-task-import-report.json` and a local-only import shape at `apps/dashboard/data/local/whatsapp-task-import.template.json`. The real `whatsapp-task-import.json` stays ignored and must not be committed.

This is manual task import only: no WhatsApp API, no webhook, no QR login, no token/cookie/session, no auto-reply, and no Production connection.
