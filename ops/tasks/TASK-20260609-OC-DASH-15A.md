---
task: TASK-20260609-OC-DASH-15A
title: OpenClaw Dashboard Real Local Data Pilot and Snapshot Refresh Drill
status: implemented-local
date: 2026-06-10
scope: local-real-data-pilot
safetyMode: read-only
mutationEnabled: false
productionWiring: disabled
---

# TASK-20260609-OC-DASH-15A

## Summary

Added a local-only real data pilot pipeline for discovering safe local files, sanitizing and mapping them, generating a dashboard-compatible snapshot, producing a pilot report, and running a snapshot refresh drill.

## Acceptance Criteria

- [x] Discovery script exists.
- [x] Parser, sanitizer, mapper, and validation helpers exist.
- [x] Real local snapshot generator exists.
- [x] Pilot report generator exists.
- [x] Refresh drill script exists.
- [x] Test script exists.
- [x] Discovery report generated.
- [x] Real local dashboard snapshot generated.
- [x] Pilot report generated.
- [x] Snapshot can be loaded through `?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json`.
- [x] Quality gate includes refresh drill and pilot tests.
- [x] Safety scan includes real local pilot files.
- [x] Verifier checks Sprint 15A outputs.
- [x] Docs, README, smoke tests, and phase log updated.
- [x] No secrets, `.env` reading, production endpoint, absolute machine paths in generated committed files, network calls, mutation endpoint, production deploy, GitHub Actions / CI, or new dependency.

## Execution Plan

1. Add real local source config sample.
2. Add discovery, parser, sanitizer, mapper, and validation helpers.
3. Add real local dashboard snapshot generator.
4. Add pilot report and refresh drill scripts.
5. Add pilot tests.
6. Update UI markers, quality gate, safety scan, and verifier.
7. Update docs, task memory, and artifacts.

## Execution History

- Git preflight was attempted; Git remains unavailable in PowerShell PATH.
- Added local-only discovery and redacted reports.
- Added snapshot refresh drill and tests.
- Added UI markers for Real Local Data Pilot.
- Updated quality gate, safety scan, verifier, docs, and smoke tests.

## Files Changed

- `apps/dashboard/data/local-ingest/real-local-data.sources.sample.json`
- `apps/dashboard/scripts/discover-real-local-data.mjs`
- `apps/dashboard/scripts/lib/real-local-data-*.mjs`
- `apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs`
- `apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs`
- `apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs`
- `apps/dashboard/scripts/test-real-local-data-pilot.mjs`
- `apps/dashboard/data/generated/real-local-*.json`
- `apps/dashboard/src/app.js`
- `apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `apps/dashboard/verify-dashboard.mjs`
- Sprint 15A docs, smoke tests, phase log, task memory, and artifacts.

## Commands Executed

```bash
node apps/dashboard/scripts/discover-real-local-data.mjs
node apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs
node apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs
node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs
node apps/dashboard/scripts/test-real-local-data-pilot.mjs
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
node apps/dashboard/scripts/safety-scan-dashboard.mjs
node apps/dashboard/verify-dashboard.mjs
```

## Test Results

Local command run completed successfully:

- `OpenClaw real local data discovery completed.`
- `OpenClaw real local dashboard snapshot generated.`
- `OpenClaw real local data pilot report generated.`
- `OpenClaw real local snapshot refresh drill passed.`
- `OpenClaw real local data pilot tests passed.`
- `OpenClaw Dashboard quality gates passed.`
- `OpenClaw Dashboard safety scan passed.`
- `OpenClaw dashboard scaffold verification passed.`

## Risk Notes

- Pilot uses local files only and summarizes logs.
- Generated reports must be reviewed before commit.
- Git remains unavailable in this PowerShell PATH; manual Git review is required.

## Artifact Refs

- `apps/dashboard/data/generated/real-local-data-discovery-report.json`
- `apps/dashboard/data/generated/real-local-dashboard-export.generated.json`
- `apps/dashboard/data/generated/real-local-data-pilot-report.json`
- `artifacts/TASK-20260609-OC-DASH-15A/README.md`

## Real Local Data Notes

Discovery defaults to committed safe samples when no CLI source paths are provided.

## Snapshot Refresh Drill Notes

The drill runs discovery, snapshot generation, pilot report generation, and safety validation.

## Redaction Notes

Absolute paths, production URLs, secret-like assignments, and email-like personal data are redacted or blocked before generated output.

## Reviewer Notes

Reviewer to fill after manual browser acceptance and Git diff review.
