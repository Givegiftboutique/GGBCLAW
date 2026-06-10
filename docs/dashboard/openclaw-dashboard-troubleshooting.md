# OpenClaw Dashboard Troubleshooting

Task: `TASK-20260609-OC-DASH-006`

## Dashboard Is Blank

1. Open browser developer tools and check for red console errors.
2. Confirm the local server is serving `apps/dashboard/index.html`.
3. Confirm the browser URL is `http://localhost:5173/` or a supported hash route.
4. Open `http://localhost:5173/?source=mock`.
5. Run `node apps/dashboard/verify-dashboard.mjs`.

Expected visible markers include `Overview`, `Agents`, `Tasks`, `Reviews`, `Logs`, `Backups`, `Settings`, `RBAC`, `Runbook`, `read-only`, and `mock-only`.

For gateway-stub mode, expected markers also include `gateway-stub`, `Production wiring`, and `disabled`.

## Source Validation Fails

1. Confirm the requested JSON file exists under `apps/dashboard`.
2. Run the local validator against the file.
3. Confirm required arrays and schema version are present.
4. Confirm no production endpoint, token-like assignment, cookie-like assignment, or password-like assignment is present.

The dashboard should fall back to mock data and show a fallback reason.

## Gateway-stub Validation Fails

1. Confirm every file exists under `apps/dashboard/data/gateway-stub/`.
2. Run the local quality gate.
3. Confirm fixture envelopes use `gateway-read-only-v1`, `safetyMode: read-only`, `mutationEnabled: false`, and `productionWiring: disabled`.
4. Confirm tasks include queued, running, review_pending, succeeded, failed, timed_out, cancelled, and lost.
5. Confirm there are 8 agents and every agent has role, responsibilities, allowed actions, denied actions, workspace scope, tool profile, and risk level.

Do not replace the fixture failure with a live gateway call.

## Gateway Fixture Diff Fails

1. Open `apps/dashboard/data/generated/gateway-fixture-diff-report.json`.
2. Review `breakingChanges` first.
3. Fix missing files, endpoints, response sections, lifecycle states, safety metadata, mapper errors, or unsafe values.
4. Treat a changed stable hash as a review warning.
5. Regenerate `apps/dashboard/data/gateway-stub/baseline/gateway-contract-baseline.json` only when the contract fixture change is intentional.

Do not regenerate the baseline just to hide a breaking change.

## Local Ingest Fails

1. Run `node apps/dashboard/scripts/test-local-ingest.mjs`.
2. Confirm the file is JSON and uses a supported ingest shape.
3. Confirm there are no secrets, production endpoints, or absolute machine paths.
4. Confirm `safetyMode` is read-only and `mutationEnabled` is false.

The dashboard should fall back to the generated snapshot, then mock.

## Dev Gateway Is Blocked Or Missing

1. Run `node apps/dashboard/scripts/test-dev-gateway-config.mjs`.
2. Confirm `baseUrl` is one of the allowed local HTTP hosts.
3. Confirm unsafe production-like URLs are blocked before fetch.
4. Confirm no credentials, auth headers, cookies, localStorage, or sessionStorage token handling exists.

Missing or blocked dev gateway sources should fall back safely.

## RBAC Role Simulation Looks Wrong

1. Run `node apps/dashboard/scripts/test-rbac-policy.mjs`.
2. Confirm the role is one of viewer, operator, reviewer, admin, or audit-only.
3. Confirm role state is memory-only and no browser storage write exists.
4. Confirm forbidden permissions such as `reviews:approve`, `reviews:reject`, `backups:restore`, `settings:update`, `gateway:write`, and `production:mutate` are not granted.

## Action Draft Preview Is Missing

1. Open Reviews, Backups, or Settings.
2. Switch the simulated role to one with a draft-only permission.
3. Click a generate draft button.
4. Confirm JSON preview shows dryRun true, mutationEnabled false, productionWiring disabled, requiresHumanApproval true, and notSubmitted true.
5. Run `node apps/dashboard/scripts/test-action-drafts.mjs`.

Do not replace a draft issue with a real approve, reject, backup, restore, settings update, or gateway write.

## Local Release Verification Fails

1. Run `node apps/dashboard/scripts/generate-release-manifest.mjs`.
2. Run `node apps/dashboard/scripts/create-local-release-bundle.mjs`.
3. Run `node apps/dashboard/scripts/verify-local-release.mjs`.
4. Confirm `apps/dashboard/data/generated/release-manifest.json` and `apps/dashboard/release/local-release-index.json` exist.
5. Confirm both records show safetyMode read-only, mutationEnabled false, and productionWiring disabled.

Do not fix release verification by enabling production deploy, GitHub Actions, production Gateway, production API, or mutation endpoints.

## Observability Report Looks Wrong

1. Run `node apps/dashboard/scripts/generate-observability-report.mjs`.
2. Run `node apps/dashboard/scripts/test-observability.mjs`.
3. Confirm every alert has notificationSent false, localOnly true, mutationEnabled false, and productionWiring disabled.
4. Confirm alert delivery remains local-preview-only.

Do not fix observability by adding webhook, email, Slack, SMS, production Gateway, or mutation wiring.

## Production Readiness Report Looks Wrong

1. Run `node apps/dashboard/scripts/generate-production-readiness-report.mjs`.
2. Run `node apps/dashboard/scripts/test-production-readiness.mjs`.
3. Confirm productionDeploy false.
4. Confirm recommendation is no-go-for-production.
5. Confirm real auth review, production Gateway security review, secrets management plan, operator signoff, backup restore drill, incident response plan, and owner assignments remain listed until complete.

Do not change the recommendation to production-ready in this scaffold.

## Generated Snapshot Is Missing

Run:

```bash
node apps/dashboard/scripts/generate-dashboard-snapshot.mjs
```

Then open:

```text
http://localhost:5173/?source=json&data=./data/generated/dashboard-export.generated.json
```

## Quality Gates Fail

1. Read `apps/dashboard/data/generated/quality-gate-report.json`.
2. Run `node apps/dashboard/scripts/safety-scan-dashboard.mjs`.
3. Run `node apps/dashboard/verify-dashboard.mjs`.
4. Fix only the reported scaffold, docs, or local data issue.

Do not connect production API, enable mutation, read secrets, or change deploy workflow while resolving Phase 06 issues.

## Odd Root-level Files Appear In Git

- Do not stage junk root files.
- Do not delete unrelated root-level files unless a separate cleanup task approves it.
- Run Git review commands in Git Bash or VS Code terminal if PowerShell cannot find Git.
- Suggested manual checks: `git status`, `git diff --stat`, and `git diff --name-only`.
