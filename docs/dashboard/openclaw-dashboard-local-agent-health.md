# OpenClaw Dashboard Local Agent Health

## Purpose

Sprint 22A adds local real agent health as a local-only, read-only review layer for the current single-agent operator truth candidate.

This is not a production gateway integration. It does not restart, stop, start, repair, or mutate any agent.

## Local-only health source

The local health input contract lives at:

```text
apps/dashboard/data/local-agent-health/local-agent-health.sample.json
```

The generated report path is:

```text
apps/dashboard/data/generated/local-real-agent-health-report.json
```

The operator checklist path is:

```text
apps/dashboard/data/generated/operator-agent-health-checklist.json
```

The health source must remain `local-file-only`.

## Expected real agent count = 1

The report aligns to:

```text
apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json
```

expected real agent count = 1.

## Health statuses

- `online`: heartbeat is fresh in the reviewed local file.
- `stale`: heartbeat is present but old.
- `unknown`: heartbeat is missing or cannot be judged.
- `review-required`: the local file requires operator review before trusting the status.

## Commands

```bash
node apps/dashboard/scripts/generate-local-real-agent-health-report.mjs
node apps/dashboard/scripts/generate-operator-agent-health-checklist.mjs
node apps/dashboard/scripts/test-local-real-agent-health.mjs
```

## No restart

Blocked actions:

- `restart-agent`
- `stop-agent`
- `start-agent`
- `production-gateway-connect`
- `mutation`

If health is `unknown` or `stale`, use the manual operator runbook outside the Dashboard. Do not add a restart button.

## Relationship to fixtures

`mock` and `gateway-stub` remain fixture/demo sources only. They must not be used as health truth.

## Production still no-go

production still no-go. Safety mode remains `read-only`, `mutationEnabled` remains false, and `productionWiring` remains disabled.

## Sprint 22B: Sanitized reviewed JSON intake

Operators can copy the sanitized example:

```text
apps/dashboard/data/local/reviewed-local-agent-health.example.json
```

to the local-only reviewed input path:

```text
apps/dashboard/data/local/reviewed-local-agent-health.json
```

Do not commit private or secret-bearing health files. The reviewed input must keep `environment = local`, `productionReady = false`, `expectedAgentCount = 1`, `agents.length = 1`, and safety flags disabling remote fetch, mutation, restart, and production gateway connection.

Valid reviewed input sets `healthSource` to `local-reviewed-json`. Missing or invalid input falls back to `local-file-only`; invalid input sets review-required follow-up. The validator rejects suspicious keys such as API key, token, cookie, secret, password, Authorization, bearer, credential, privateKey, accessToken, and refreshToken, and records only key/path/message, never values.

## Sprint 22C: Local health evidence review

Sprint 22C adds an evidence review pack:

```text
apps/dashboard/data/generated/local-health-evidence-review-report.json
apps/dashboard/data/generated/operator-local-health-evidence-checklist.json
```

The report records whether the reviewed local JSON was accepted, invalid, missing, or unsafe. It records fallback status and validation categories without printing raw values.

Required evidence markers:

- redaction applied
- raw values never printed
- accepted source is `local-reviewed-json` or `local-file-only`
- no fallback to `mock` or `gateway-stub`
- production still no-go
- no restart / no mutation
