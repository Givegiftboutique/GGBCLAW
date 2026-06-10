# TASK-20260609-OC-DASH-20A Artifacts

Sprint 20A artifacts for the OpenClaw Dashboard v1.0.0 internal release candidate and manual sign-off package.

## Generated Reports

- `apps/dashboard/data/generated/internal-release-candidate-report.json`
- `apps/dashboard/data/generated/internal-signoff-package.json`

## Commands

```bash
node apps/dashboard/scripts/generate-internal-release-candidate.mjs
node apps/dashboard/scripts/generate-internal-signoff-package.mjs
node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs
node apps/dashboard/scripts/test-internal-release-candidate.mjs
```

## Safety Notes

- Internal use only.
- `signoffStatus` remains pending.
- `notApprovedYet` remains true.
- `manualSignoffRequired` remains true.
- Production remains `no-go-for-production`.
- No production deploy, production Gateway, production API, mutation endpoint, secrets, credentials, auth/token/cookie handling, or external notification delivery.
