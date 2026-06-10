# OpenClaw Dashboard Internal Sign-off

Task: `TASK-20260609-OC-DASH-20A`

## Purpose

This document defines the manual sign-off package for promoting `v1.0.0-internal-rc1` to `v1.0.0-internal`.

No approval is automatic. Generated files are placeholders and evidence references only.

## Required Reviewers

- operator-owner
- technical-owner
- security-reviewer
- business-owner

## Sign-off Status

Current generated status must remain:

```text
signoffStatus: pending
notApprovedYet: true
manualSignoffRequired: true
```

## Sign-off Checklist

- quality gate pass
- safety scan pass
- final beta verification pass
- security/privacy audit reviewed
- data retention reviewed
- operator workflow reviewed
- incident drill reviewed
- static hosting dry-run reviewed
- access checklist reviewed
- production readiness remains no-go
- rollback tag confirmed
- operator owner assigned
- monitoring owner assigned
- rollback owner assigned
- incident response owner assigned

## Owner Checklists

Operator owner:

- Confirm dashboard renders in local browser.
- Confirm source badge and safety markers are visible.
- Confirm runbook and manual smoke tests are understood.

Technical owner:

- Confirm routes and source modes are unchanged.
- Confirm quality gate, verifier, and safety scan pass.
- Confirm no deploy workflow or large release bundle was added.

Security reviewer:

- Confirm security/privacy audit and sanitization reports are reviewed.
- Confirm no secrets, production endpoints, auth/token/cookie handling, external notification delivery, or mutation wiring exists.
- Confirm data retention remains `draft-for-internal-review`.

Business owner:

- Confirm internal use scope.
- Confirm production remains `no-go-for-production`.
- Confirm any external sharing or hosting requires separate approval.

## Before Tagging v1.0.0-internal

Run:

```bash
node apps/dashboard/scripts/generate-internal-release-candidate.mjs
node apps/dashboard/scripts/generate-internal-signoff-package.mjs
node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
node apps/dashboard/scripts/safety-scan-dashboard.mjs
node apps/dashboard/verify-dashboard.mjs
```

Review:

```text
apps/dashboard/data/generated/internal-release-candidate-report.json
apps/dashboard/data/generated/internal-signoff-package.json
```

## Manual Approval Placeholder

Reviewer name:

Date:

Decision:

Notes:

## Not Allowed

- do not auto-approve
- do not mark production ready
- do not change `signoffStatus` to approved in generated files
- do not set `notApprovedYet` to false
- do not production deploy
- do not add production Gateway, production API, mutation endpoint, deploy workflow, credentials, token, cookie handling, or external notification delivery

## Sprint 21A Production Track Note

The internal sign-off package allows internal formal use only. Sprint 21A production track reports remain planning-only and blocked:

- `productionTrackStatus: planning-only`
- `gatewayConnectionStatus: not-connected`
- `readinessStatus: not-ready`
- `entryGateStatus: blocked`

Manual sign-off for internal use does not approve production Gateway connection. Production track also requires Fixture Quarantine + Single Agent Truth Alignment because the real operator environment is expected to have only 1 real agent and the 8-agent data is fixture-only.
