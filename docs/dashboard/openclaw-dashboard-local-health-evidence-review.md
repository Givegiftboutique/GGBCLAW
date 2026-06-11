# OpenClaw Dashboard Local Health Evidence Review

## Purpose

Sprint 22C adds a local health evidence review pack on top of Sprint 22B sanitized reviewed JSON intake.

It is local-only and read-only. It does not connect to production, does not restart agents, does not mutate agent runtime, and does not print raw reviewed JSON values.

## Reports

```text
apps/dashboard/data/generated/local-health-evidence-review-report.json
apps/dashboard/data/generated/operator-local-health-evidence-checklist.json
```

Commands:

```bash
node apps/dashboard/scripts/generate-local-real-agent-health-report.mjs
node apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs
node apps/dashboard/scripts/generate-operator-local-health-evidence-checklist.mjs
node apps/dashboard/scripts/test-local-health-evidence-review.mjs
```

## Evidence Statuses

- `reviewed-valid`: sanitized reviewed JSON was accepted and the health source is `local-reviewed-json`.
- `reviewed-invalid-fallback`: reviewed JSON existed but failed contract validation, so the report fell back to `local-file-only`.
- `missing-fallback`: reviewed JSON was not present, so the report fell back to `local-file-only`.
- `sample-fallback`: sample local health input is being used for review only.
- `review-required`: operator review is required before trusting health.
- `unsafe-rejected`: suspicious keys were found and only redacted key/path/category evidence was recorded.

## Redaction Rules

Evidence reports may record key names, JSON paths, rule ids, categories, and pass/fail status. They must never print raw token, cookie, secret, password, API key, Authorization, private endpoint, or local machine path values.

Required markers:

```text
redaction applied = true
raw values never printed
rawValuesPrinted = false
```

## Operator Handling

If input is missing, create a sanitized reviewed local health JSON from the example and rerun the report.

If input is invalid or unsafe, remove unsafe fields and rerun the report. Do not paste raw values into docs, reports, tickets, chat, or screenshots.

If health is `unknown`, `stale`, or `review-required`, use the manual runbook. The Dashboard must not restart, stop, start, approve, deploy, notify externally, or connect to a production gateway.

## Relationship To Data Sources

The evidence pack aligns only to:

```text
apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json
```

`mock` and `gateway-stub` remain fixture/demo sources only and must not be used as health truth.

Production still no-go. Safety mode remains `read-only`, `mutationEnabled` remains false, and `productionWiring` remains disabled.
## Sprint 23A Operator Usability Note

The evidence review panel is now surfaced in Operator Home and daily troubleshooting. If evidence fallback is active, inspect the sanitized reviewed local health JSON and regenerate reports. Do not paste raw values into reports, and do not restart or mutate from the Dashboard.

## Sprint 23B Daily Runbook Link

Daily Operator Runbook mode consumes the evidence review report. Evidence fallback, missing reviewed input, invalid reviewed input, or unsafe evidence keeps the daily status at `Review Required` or `Blocked`; it never enables restart, mutation, deploy, or production gateway connection.
