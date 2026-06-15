---
task_id: TASK-20260609-OC-DASH-27A
title: OpenClaw Dashboard Safe Task Metadata Discovery
status: completed
scope: local-only dashboard safety discovery
production_status: no-go-for-production
---

# Summary

Sprint 27A adds schema-only discovery for local WSL OpenClaw task metadata. It does not read task rows or task content.

# Acceptance Criteria

- Task metadata safety classifier exists.
- WSL schema discovery script exists.
- Discovery report is redacted and row-free.
- UI explains that task data is not displayed yet.
- Quality gate, safety scan, and verifier cover the discovery.

# Execution Plan

1. Add safe column classifier.
2. Add WSL schema-only discovery script.
3. Add discovery test.
4. Add UI copy and docs.
5. Update quality, safety, verifier, and RC audit.
6. Run checks and close out with tag.

# Execution History

- Added column classification for safe, forbidden, and review-required task metadata columns.
- Added schema-only discovery report generation.
- Kept raw task rows and sensitive task content out of reports.

# Files Changed

See sprint commit for the exact file list.

# Commands Executed

- `node apps/dashboard/scripts/discover-wsl-openclaw-task-metadata-schema.mjs --distro Ubuntu-24.04 --state-dir <WSL_OPENCLAW_STATE_DIR> --dry-run`
- `node apps/dashboard/scripts/test-wsl-openclaw-task-metadata-discovery.mjs`
- `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `node apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `node apps/dashboard/verify-dashboard.mjs`

# Test Results

To be recorded during closeout.

# Risk Notes

Task metadata is not exported in this sprint. Safe candidate columns still require human review before any metadata-only extraction.

# Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-27A/README.md`
- `apps/dashboard/data/generated/wsl-openclaw-task-metadata-schema-discovery-report.json`

# Safety Notes

No raw rows, prompt, message, content, body, input, output, token, credential, or Production wiring is introduced.

# Reviewer Notes

Pending reviewer notes.
