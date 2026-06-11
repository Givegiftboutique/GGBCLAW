# OpenClaw Dashboard Source Lockdown

Sprint 21D adds operator source selection lockdown. The goal is to reduce accidental trust in fixture data while keeping mock and gateway-stub fixtures for contract and lifecycle regression tests.

## Policy

```text
operatorRecommendedSource: local-ingest
operatorRecommendedData: ./data/generated/real-local-dashboard-export.single-agent.generated.json
defaultEntryBehavior: operator-safe-notice
productionStatus: no-go-for-production
safetyMode: read-only
mutationEnabled: false
productionWiring: disabled
```

## Default Entry Behavior

Opening `/` without a `source` query must not silently imply that `mock` is real data. The dashboard shows an operator-safe notice and the recommended single-agent local-ingest URL.

## Fixture Source Warnings

- `mock` requires explicit demo acknowledgement and has `defaultAllowed: false`.
- `gateway-stub` requires explicit demo acknowledgement and has `defaultAllowed: false`.
- Both are high warning sources.
- Neither source is operator truth.

## Review Required Sources

- `json`
- `artifact`

These require operator review before they can be used for operational interpretation.

## Dev-only Sources

- `dev-gateway`

This remains dev read-only only. It is not production operator truth.

## Production Blockers

Production remains blocked until source truth is approved, fixture data is quarantined from operator truth, and production gateway/security/auth/deploy reviews are complete. No production connection is made by this sprint.

## Future Work

Future production work must keep the source lockdown policy in place and must not promote fixture data into production inventory evidence.
## Sprint 22A health source

Local real agent health is a read-only layer on top of the locked down single-agent operator source.
It uses local-file-only health input and cannot use mock or gateway-stub as health truth.
No restart, stop, start, mutation, or production gateway connection is allowed.
