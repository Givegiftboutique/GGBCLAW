# OpenClaw Dashboard Production Readiness Review

Task: `TASK-20260609-OC-DASH-14A`

## Scope

Sprint 14A adds a local production readiness review for internal operator beta. It is a checklist and report only. It does not perform production deploy and does not mark the dashboard production-ready.

Initial recommendation:

```text
no-go-for-production
```

Internal beta status:

```text
allowed-review-required
```

## Readiness Categories

- source_safety
- gateway_contract
- local_ingest
- dev_gateway
- rbac_auth
- action_drafts
- release_workflow
- rollback
- observability
- backup_evidence
- security_guardrails
- operator_runbook
- manual_acceptance
- known_blockers

Status values are `pass`, `warning`, `blocker`, and `not_applicable`.

## Required Before Production

- Real auth design review.
- Production Gateway security review.
- Secrets management plan.
- Operator signoff.
- Backup restore drill.
- Incident response plan.
- Deployment owner.
- Rollback owner.
- Monitoring owner.

Until these are complete, production remains no-go.

## Report Safety Flags

The readiness report must keep:

- `productionDeploy: false`
- `safetyMode: read-only`
- `mutationEnabled: false`
- `productionWiring: disabled`
- `recommendation: no-go-for-production`

The phrase production-ready is a forbidden recommendation in this scaffold.

## Commands

```bash
node apps/dashboard/scripts/generate-production-readiness-report.mjs
node apps/dashboard/scripts/test-production-readiness.mjs
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
```

Generated report:

```text
apps/dashboard/data/generated/production-readiness-report.json
```

## Manual Browser URL

```text
http://localhost:5173/?source=gateway-stub#/dashboard/observability
```

Confirm production deploy false, no-go-for-production recommendation, internal operator beta status, known blockers, and required before production items.

## Final Beta Relationship

The final beta audit may mark the dashboard `internal-beta-ready`, but it must not mark production ready. The production readiness recommendation remains `no-go-for-production` until the required before production list is complete.

Final beta report:

```text
apps/dashboard/data/generated/final-beta-audit-report.json
```

## Sprint 19A Security / Privacy Relationship

Sprint 19A adds a security/privacy and data retention review layer for internal beta readiness only. It does not certify privacy compliance and does not remove any production blocker.

Review before any production discussion:

```bash
node apps/dashboard/scripts/generate-security-privacy-audit.mjs
node apps/dashboard/scripts/test-generated-report-sanitization.mjs
node apps/dashboard/scripts/generate-data-retention-review.mjs
node apps/dashboard/scripts/generate-operator-security-checklist.mjs
node apps/dashboard/scripts/test-security-privacy-audit.mjs
```

Generated reports:

```text
apps/dashboard/data/generated/security-privacy-audit-report.json
apps/dashboard/data/generated/data-retention-review-report.json
apps/dashboard/data/generated/operator-security-checklist.json
```

Production remains `no-go-for-production` until formal security review, privacy review, auth design, secrets management, production Gateway review, operator signoff, backup restore drill, incident response plan, and owner assignments are complete.
