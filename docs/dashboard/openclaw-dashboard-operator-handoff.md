# OpenClaw Dashboard Operator Handoff

Task: `TASK-20260609-OC-DASH-FINAL-BETA-AUDIT`

## What This Dashboard Is

OpenClaw Dashboard is an internal operator beta for reviewing local and static OpenClaw operational data. It supports mock, json, artifact, gateway-stub, local-ingest, and dev-gateway source modes.

## What It Is Not

It is not a production console. It does not connect production API or production Gateway, does not submit mutations, does not deploy, does not provide real login, and does not send webhook, email, Slack, or SMS alerts.

## Internal Operator Beta Scope

- Internal operator beta: allowed with review.
- 內部 Operator Beta：可在人工審查下使用。
- Production: no-go.
- Production：暫不可上線。
- Mutation enabled: false.
- Production wiring: disabled.

## How To Run Locally

```powershell
cd "C:\Users\marke\Documents\FOR GGB OPENCLAW\apps\dashboard"
python -m http.server 5173
```

建議本地瀏覽器 URL：
```text
http://localhost:5173/?source=local-ingest#/dashboard
http://localhost:5173/?source=local-ingest#/dashboard/observability
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
http://localhost:5173/?source=gateway-stub#/dashboard/settings
http://localhost:5173/?source=gateway-stub#/dashboard/help
```

## Supported Data Sources

- `mock`
- `json`
- `artifact`
- `gateway-stub`
- `local-ingest`
- `dev-gateway`

## Commands

Quality gate:

```bash
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
```

Safety scan:

```bash
node apps/dashboard/scripts/safety-scan-dashboard.mjs
```

Local release verification:

```bash
node apps/dashboard/scripts/verify-local-release.mjs
```

Observability report:

```bash
node apps/dashboard/scripts/generate-observability-report.mjs
```

Production readiness report:

```bash
node apps/dashboard/scripts/generate-production-readiness-report.mjs
```

Final beta verification:

```bash
node apps/dashboard/scripts/generate-final-beta-audit.mjs
node apps/dashboard/scripts/verify-final-beta.mjs
```

Real local data pilot:

```bash
node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs
node apps/dashboard/scripts/test-real-local-data-pilot.mjs
```

## How To Interpret Alerts

Observability alerts are local preview only. Use them to decide which local source, task, agent, backup evidence, quality report, safety scan, or release record needs review. No notification is sent.

## How To Interpret Production No-go

`no-go-for-production` means internal beta can continue with review, but production must not be enabled. It is a blocker state, not a release approval.

## Rollback Using Git Tag

After final beta tag creation, rollback can use:

```bash
git checkout v0.1.0-beta
```

Run Git commands only in Git Bash or another terminal where Git is available.

## Who Should Use This

Operators, reviewers, and maintainers who need local read-only visibility into OpenClaw dashboard artifacts.

## Required Before Production

- real auth design review
- production gateway security review
- secrets management plan
- deployment owner
- rollback owner
- monitoring owner
- incident response plan
- backup restore drill
- operator signoff

## Sprint 19A Security / Privacy Handoff

Sprint 19A adds local-only security, privacy, generated report sanitization, and data retention review. It is an internal beta readiness review, not a legal compliance certification and not production approval.

Run before sharing handoff evidence:

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

Keep reports internal until an operator confirms no secrets, private data, production endpoints, browser credential handling, external notification delivery, deploy workflow, or mutation wiring was introduced.

## Sprint 20A v1 Internal RC Handoff

Sprint 20A prepares `v1.0.0-internal-rc1` for internal operator review. It does not mark sign-off approved and does not mark production ready.

Run:

```bash
node apps/dashboard/scripts/generate-internal-release-candidate.mjs
node apps/dashboard/scripts/generate-internal-signoff-package.mjs
node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs
node apps/dashboard/scripts/test-internal-release-candidate.mjs
```

Review:

- `apps/dashboard/data/generated/internal-release-candidate-report.json`
- `apps/dashboard/data/generated/internal-signoff-package.json`

Required status:

- `signoffStatus: pending`
- `notApprovedYet: true`
- `manualSignoffRequired: true`
- `productionStatus: no-go-for-production`

## Sprint 21A Production Track Planning

Production track planning is report/checklist work only:

```bash
node apps/dashboard/scripts/generate-production-track-plan.mjs
node apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs
node apps/dashboard/scripts/generate-production-entry-gates.mjs
node apps/dashboard/scripts/test-production-track-planning.mjs
```

Reports:

- `apps/dashboard/data/generated/production-track-plan-report.json`
- `apps/dashboard/data/generated/readonly-production-gateway-readiness-report.json`
- `apps/dashboard/data/generated/production-entry-gates-report.json`

Reality alignment blocker: current real operator environment is expected to have only 1 real agent. Existing 8-agent data is mock / fixture / gateway-stub lifecycle test data only. Fixture Quarantine + Single Agent Truth Alignment is required before any read-only production gateway implementation.

## Fixture Quarantine Handoff Note

The internal dashboard may show 8 agents when opened with `mock` or `gateway-stub`. That is fixture data only. The real operator environment is expected to have a single real agent. Use `local-ingest` as an operator truth candidate only after validation and review.
## Sprint 21C Single-agent Operator Truth Candidate

Use the single-agent snapshot for local-ingest operator truth candidate review:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

Expected result: 1 visible agent, Operator Truth Candidate marker, `read-only`, `mutationEnabled false`, `productionWiring disabled`, and production `no-go-for-production`.
## Sprint 21D Source Selection Handoff

The operator recommended URL is:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

`mock` and `gateway-stub` must be introduced as fixture/demo views only. The single-agent local-ingest snapshot is the operator truth candidate. Production still no-go.
## Sprint 22A local agent health

- Local health report: `apps/dashboard/data/generated/local-real-agent-health-report.json`
- Operator health checklist: `apps/dashboard/data/generated/operator-agent-health-checklist.json`
- Health source: `local-file-only`
- expected real agent count = 1
- no restart, no mutation, no production gateway.
# Sprint 22C Local Health Evidence Review

Before handoff, run:

```bash
node apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs
node apps/dashboard/scripts/generate-operator-local-health-evidence-checklist.mjs
```

Confirm redaction applied, raw values never printed, no restart, no mutation, no production gateway, and production still no-go.
## Sprint 23A Handoff Note

Daily operators should start with:

```powershell
.\apps\dashboard\scripts\start-operator-dashboard.ps1
```

Confirm Operator Home, 1 real agent, local health, local evidence review, restart disabled, mutation disabled, and production gateway disabled. If 8 agents appear, open the recommended operator URL.
