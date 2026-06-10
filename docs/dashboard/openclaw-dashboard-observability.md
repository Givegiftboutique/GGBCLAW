# OpenClaw Dashboard Observability Preview

Task: `TASK-20260609-OC-DASH-14A`

## Scope

Sprint 14A adds local observability preview only. The dashboard evaluates local/mock/dev data and generated local reports, then displays warning and alert previews for operators.

It does not send webhook, email, Slack, SMS, or any other external notification.

## Alert Rules

Supported alert types:

- `source_stale`
- `source_validation_failed`
- `agent_heartbeat_stale`
- `agent_lost`
- `task_stuck_running`
- `task_failed`
- `task_timed_out`
- `task_review_pending`
- `backup_stale`
- `backup_verification_failed`
- `quality_gate_failed`
- `safety_scan_failed`
- `release_manifest_missing`
- `release_manifest_stale`
- `dev_gateway_blocked`
- `production_wiring_violation`
- `mutation_guardrail_violation`

Severity values are `info`, `warning`, and `critical`.

## Safety Flags

Every generated report and alert must keep:

- `safetyMode: read-only`
- `notificationMode: local-preview-only`
- `notificationSent: false`
- `localOnly: true`
- `mutationEnabled: false`
- `productionWiring: disabled`

## Operator Actions

Use alerts as local review hints:

- Refresh local source data if stale.
- Review task logs locally for stuck, failed, timed out, or lost tasks.
- Re-run quality gates if the quality report is stale or failed.
- Re-run the safety scan if the safety report is stale or failed.
- Review release metadata if the release manifest is missing or stale.

Do not fix an alert by connecting production API, enabling mutation, reading secrets, or adding external notification delivery.

## Commands

```bash
node apps/dashboard/scripts/generate-observability-report.mjs
node apps/dashboard/scripts/test-observability.mjs
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
```

Generated report:

```text
apps/dashboard/data/generated/observability-report.json
```

## Manual Browser URL

```text
http://localhost:5173/?source=gateway-stub#/dashboard/observability
```

Confirm alert counts, local-preview-only notification mode, notificationSent false, safety mode read-only, production wiring disabled, mutation enabled false, and no external alert delivery button.
