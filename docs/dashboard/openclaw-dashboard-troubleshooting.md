# OpenClaw Dashboard Troubleshooting

## 8 agents appear in the dashboard

If the source is `mock` or `gateway-stub`, 8 agents are fixture only. This is expected for lifecycle and contract tests. Switch to reviewed `local-ingest` data to inspect operator truth candidate data. The current real operator assumption is 1 real agent.

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

## Final Beta Verification Fails

1. Run `node apps/dashboard/scripts/generate-final-beta-audit.mjs`.
2. Run `node apps/dashboard/scripts/verify-final-beta.mjs`.
3. Confirm all required generated reports exist.
4. Confirm app README says Internal Operator Beta.
5. Confirm `docs/dashboard/README.md`, repo hygiene doc, and operator handoff doc exist.
6. Confirm production remains no-go-for-production.
7. Confirm no `.github/workflows`, `.env`, production endpoint, mutation endpoint, external alert delivery, or large release bundle was added.

Use `docs/dashboard/openclaw-dashboard-repo-hygiene.md` before staging files.

## Real Local Data Pilot Fails

1. Run `node apps/dashboard/scripts/discover-real-local-data.mjs`.
2. Run `node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs`.
3. Review `apps/dashboard/data/generated/real-local-data-discovery-report.json`.
4. Confirm no generated file contains absolute machine paths, secrets, or production endpoints.
5. Open the generated snapshot through `?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json`.

Do not fix pilot failures by reading `.env`, adding network calls, or connecting production.

## Security / Privacy Audit Fails

1. Run `node apps/dashboard/scripts/generate-security-privacy-audit.mjs`.
2. Run `node apps/dashboard/scripts/test-generated-report-sanitization.mjs`.
3. Open `apps/dashboard/data/generated/security-privacy-audit-report.json`.
4. Review generated report findings first; source and docs warnings may need human review.
5. Confirm generated reports do not contain secrets, private data, production endpoints, or absolute machine paths.

Do not fix audit failures by adding production Gateway wiring, deploy workflow, credential handling, external notification delivery, or mutation endpoints.

## Data Retention Review Looks Wrong

1. Run `node apps/dashboard/scripts/generate-data-retention-review.mjs`.
2. Open `apps/dashboard/data/generated/data-retention-review-report.json`.
3. Confirm `retentionPolicyStatus` is `draft-for-internal-review`.
4. Confirm local real snapshots require operator review before commit.
5. Confirm evidence manifests remain local-only references.

The retention review is an internal beta draft, not legal certification.

## v1 Internal RC Verification Fails

1. Run `node apps/dashboard/scripts/generate-internal-release-candidate.mjs`.
2. Run `node apps/dashboard/scripts/generate-internal-signoff-package.mjs`.
3. Run `node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs`.
4. Confirm `apps/dashboard/data/generated/internal-release-candidate-report.json` exists.
5. Confirm `apps/dashboard/data/generated/internal-signoff-package.json` exists.
6. Confirm `signoffStatus` remains `pending` and `notApprovedYet` remains true.

Do not fix RC failures by approving sign-off, marking production ready, adding deploy workflow, or adding production Gateway/API wiring.

## Production Track Planning Looks Ready By Mistake

1. Run `node apps/dashboard/scripts/generate-production-track-plan.mjs`.
2. Run `node apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs`.
3. Run `node apps/dashboard/scripts/generate-production-entry-gates.mjs`.
4. Run `node apps/dashboard/scripts/test-production-track-planning.mjs`.
5. Confirm `productionTrackStatus` is `planning-only`.
6. Confirm `gatewayConnectionStatus` is `not-connected`.
7. Confirm `readinessStatus` is `not-ready`.
8. Confirm `entryGateStatus` is `blocked`.
9. Confirm the reports include Fixture Quarantine + Single Agent Truth Alignment.

Do not fix this by connecting production Gateway, adding credentials, marking production ready, or treating 8-agent fixture data as real operator truth. Current real operator environment is expected to have only 1 real agent.

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
## Real Local Snapshot Shows 5 Agents

Use the Sprint 21C single-agent snapshot instead of treating the older generated snapshot as operator truth:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

If the older snapshot is opened, the UI should show review required. Do not edit mock or gateway-stub fixtures to fix this; those remain 8-agent test data.
## Sprint 21D Source Selection Troubleshooting

If `/` opens with fixture data, use the recommended operator URL:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

If the dashboard shows `mock` or `gateway-stub`, treat it as high-warning fixture/demo data. If it shows 8 agents, do not treat that count as real inventory. Run `node apps/dashboard/scripts/test-operator-source-lockdown.mjs` to verify the source lockdown policy.
## Sprint 22A health unknown or stale

If Local Real Agent Health shows `unknown` or `review-required`, the local health report needs operator review.
If it shows `stale`, do not restart from the Dashboard. Use the manual runbook outside the Dashboard.
The health source must stay `local-file-only`; production still no-go.
## Sprint 22B Local Health Intake Troubleshooting

- If health remains `local-file-only`, the reviewed JSON may be missing or invalid.
- Check `apps/dashboard/data/local/reviewed-local-agent-health.json` against `apps/dashboard/data/local/reviewed-local-agent-health.example.json`.
- Do not add API keys, tokens, cookies, secrets, Authorization, production URLs, restart commands, or mutation actions.
- Rerun `node apps/dashboard/scripts/generate-local-real-agent-health-report.mjs` after local sanitization.
# Sprint 22C Local Health Evidence Review

For local health evidence issues:

- `missing-fallback`: reviewed local health JSON is absent; use the example and keep it sanitized.
- `reviewed-invalid-fallback`: reviewed JSON failed contract validation; fix the local file.
- `unsafe-rejected`: remove suspicious key categories before rerunning.

Evidence reports must keep `redactionApplied true` and `rawValuesPrinted false`. Production still no-go.
## Sprint 23A Operator Usability Troubleshooting

- If you see 8 agents, you are likely in `mock` or `gateway-stub`; open the recommended operator URL.
- If the source badge says `mock`, this is demo fixture data only.
- If health is `unknown` or `stale`, use the runbook and do not restart from Dashboard.
- If evidence fallback is active, inspect sanitized reviewed local health JSON and regenerate local reports.
- If the local server is closed, rerun `apps/dashboard/scripts/start-operator-dashboard.ps1`.

## Sprint 23B Daily Runbook Troubleshooting

- If today status is `Review Required`, read the status reasons and follow safe next steps. This is expected for unknown/stale health or evidence fallback.
- If today status is `Fixture Mode`, open the recommended single-agent operator URL and do not treat 8 agents as real inventory.
- If today status is `Blocked`, stop daily interpretation and review agent count, production status, mutation, restart, production gateway, and evidence safety.
- If today status is `Unknown`, regenerate the daily summary and runbook checklist reports.
- Never resolve a daily runbook issue by restarting, mutating, deploying, adding auth/token/secrets, or connecting production gateway from Dashboard.
## Sprint 23C Reviewed Health Input Troubleshooting

- `missing-local-input`: copy the template to the ignored local reviewed input path and run the dry-run validator.
- `invalid-fallback-required`: edit the local reviewed JSON to match the template and one-agent contract.
- `unsafe-rejected`: remove unsafe keys such as token, cookie, secret, API key, Authorization, endpoint, webhook, email, phone, private key, credentials, or session.
- Never paste raw secret values into generated reports or task notes.
- Keep production gateway, restart, mutation, and deploy disabled.

## Sprint 24A Production Entry Gate

If the Production Entry Gate shows `blocked`, check agent count, `productionReady false`, production wiring disabled, and blocked actions. If it shows `review-required`, review local health, evidence, reviewed input dry-run, and daily runbook before any future external production discussion.

## Sprint 24B Production Adapter Simulator

If the simulator shows anything other than disabled, disconnected, simulator-only, and production no-go, stop and rerun the simulator report, safety scan, and verifier. Do not fix it by adding an endpoint, auth input, token, production gateway connection, deploy command, restart action, or mutation action.
