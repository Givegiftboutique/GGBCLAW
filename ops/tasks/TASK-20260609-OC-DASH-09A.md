---
task: TASK-20260609-OC-DASH-09A
title: OpenClaw Dashboard Real Local Data Ingest and Read-only Dev Gateway Adapter
date: 2026-06-09
status: verified
safety_mode: read-only
production_wiring: disabled
---

# TASK-20260609-OC-DASH-09A

## Summary

Add JSON-only local ingest and read-only dev gateway sources for the OpenClaw Dashboard.

## Acceptance Criteria

- [ ] Local ingest sample files exist.
- [ ] Local ingest adapter, mapper, and validation exist.
- [ ] `?source=local-ingest` works.
- [ ] Dev gateway adapter, client, config, and validation exist.
- [ ] `?source=dev-gateway` without `baseUrl` does not fetch and falls back safely.
- [ ] Safe localhost dev base URL is allowed.
- [ ] Production-like base URL is blocked.
- [ ] Dev gateway client uses GET only and `credentials: "omit"`.
- [ ] No auth headers, cookies, localStorage token, or sessionStorage token handling.
- [ ] Quality gate, safety scan, verifier, docs, smoke tests, and task memory are updated.
- [ ] No production API, production Gateway, mutation endpoint, deploy, CI, secrets, or dependency changes.

## Execution Plan

1. Add local ingest samples and JSON-only mapping.
2. Add local ingest validation and adapter.
3. Add dev gateway URL safety, client, validation, and adapter.
4. Wire source modes and fallback chain.
5. Update UI source markers and Runbook.
6. Add local ingest and dev gateway tests.
7. Update quality gate, safety scan, verifier, docs, and artifacts.
8. Run automated and browser verification.

## Execution History

- Git commands were attempted from PowerShell and were unavailable on the shell path.
- Local ingest samples were added with local/example URIs only.
- Dev gateway is disabled unless explicitly requested with safe `baseUrl`.

## Files Changed

- `apps/dashboard/data/local-ingest/`
- `apps/dashboard/src/lib/adapters/local-ingest-*`
- `apps/dashboard/src/lib/adapters/dev-gateway-*`
- `apps/dashboard/scripts/test-local-ingest.mjs`
- `apps/dashboard/scripts/test-dev-gateway-config.mjs`
- `apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `apps/dashboard/verify-dashboard.mjs`
- `apps/dashboard/README.md`
- `docs/dashboard/openclaw-dashboard-local-ingest.md`
- `docs/dashboard/openclaw-dashboard-dev-gateway.md`
- `docs/dashboard/*`
- `tests/manual-smoke-tests.md`
- `docs/phase-log.md`
- `artifacts/TASK-20260609-OC-DASH-09A/README.md`

## Commands Executed

- `git status`
- `git diff --stat`
- `git diff --name-only`
- `node apps/dashboard/scripts/test-local-ingest.mjs`
- `node apps/dashboard/scripts/test-dev-gateway-config.mjs`
- `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `node apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `node apps/dashboard/verify-dashboard.mjs`
- Syntax checks for new scripts and adapters

## Test Results

- Git commands failed because Git is unavailable on the PowerShell shell path.
- Local ingest tests passed.
- Dev gateway config tests passed.
- Quality gate passed.
- Safety scan passed.
- Verifier passed.
- Syntax checks passed.
- Browser acceptance passed for local-ingest, dev-gateway missing baseUrl fallback, safe localhost dev gateway fallback when server is absent, blocked production-like baseUrl fallback, and Runbook markers.
- Browser console errors: none observed.

## Risk Notes

- Git review must be done manually in Git Bash or VS Code terminal.
- CSV ingest is future work; Sprint 09A supports JSON only.
- Dev gateway localhost server may be absent during browser tests; fallback is expected.

## Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-09A/README.md`
- `apps/dashboard/data/local-ingest/`

## Local Ingest Notes

Local ingest maps supported JSON shapes into the Dashboard data model and fails on unsafe values.

## Dev Gateway Notes

Dev gateway allows strict local HTTP URLs only, uses read-only GET, and omits credentials.

## Fallback Behavior

- Local ingest failure: generated snapshot, then mock.
- Dev gateway missing, blocked, or failed: gateway-stub, then generated snapshot, then mock.

## Reviewer Notes

Reviewer to confirm Git diff hygiene and browser acceptance before commit.

## Suggested Commit Message

```text
feat(dashboard): add local ingest and dev gateway read-only sources
```
