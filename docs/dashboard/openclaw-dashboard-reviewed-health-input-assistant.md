# OpenClaw Dashboard Reviewed Health Input Assistant

Sprint 23C adds a local-only assistant for preparing reviewed local health JSON without asking the operator to edit committed generated reports.

## Purpose

The assistant gives operators a safe template and a dry-run validator for local health input. It is meant for one real local agent and keeps the Dashboard read-only:

- production remains `no-go-for-production`
- mutation remains disabled
- restart / stop / start remain unavailable
- production gateway remains disconnected
- raw reviewed local health values are not printed

## Files

- Template: `apps/dashboard/data/local/reviewed-local-agent-health.template.json`
- Local input to create manually: `apps/dashboard/data/local/reviewed-local-agent-health.json`
- Dry-run report: `apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json`
- Operator checklist: `apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json`

The real local input file is protected by `apps/dashboard/data/local/.gitignore` and must not be committed.

## How To Use

1. Copy the template to `apps/dashboard/data/local/reviewed-local-agent-health.json`.
2. Edit only sanitized local health fields.
3. Run `node apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs`.
4. Review readiness in the generated dry-run report.
5. Only then regenerate local health / evidence / daily runbook reports.

## Readiness

- `ready-for-local-use`: local reviewed input can be used by local health generation.
- `missing-local-input`: no local reviewed input exists; safe fallback remains active.
- `invalid-fallback-required`: structure or expected one-agent fields need operator edit.
- `unsafe-rejected`: forbidden field category was found; raw values were not printed.
- `review-required`: operator review is still needed before daily interpretation.

## Forbidden Content

Do not place token, cookie, password, secret, API key, Authorization, endpoint, webhook, email, phone, private key, credential, or session fields into reviewed local health JSON.

## Safety

The assistant is local-only and read-only. It does not read `.env`, does not fetch remote health, does not connect production gateway, and does not restart or mutate agents.
