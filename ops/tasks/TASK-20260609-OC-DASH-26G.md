---
task_id: TASK-20260609-OC-DASH-26G
title: OpenClaw Dashboard WSL Local OpenClaw Safe Export Adapter
status: in-progress
scope: dashboard-local-only
production: no-go-for-production
---

# Summary

Sprint 26G adds a separate WSL local export adapter for Dashboard. The adapter does not patch installed OpenClaw runtime files. It reads safe local state metadata and writes an ignored Dashboard local export file.

# Acceptance Criteria

- WSL adapter script exists.
- PowerShell helper exists.
- Dry run creates a redacted generated report.
- Real local export file remains ignored and uncommitted.
- Adapter skips raw prompt, session, message, content, body, input, output, provider key, pass phrase, browser value, request sign-in header, and sign-in material fields.
- Connector can read a WSL adapter export and preserve source label.
- Production, mutation, restart, deploy, auth, and gateway remain disabled.

# Execution Plan

1. Add WSL safe export adapter and PowerShell helper.
2. Add adapter tests and connector source-label coverage.
3. Update UI copy for WSL safe export.
4. Update quality gate, safety scan, verifier, docs, task memory, and artifact notes.
5. Run required checks.
6. Precision add, commit, push, and tag after clean review.

# Execution History

- Preflight confirmed `main`, clean tree, Sprint 26D and RC2 tags present.
- Added adapter and helper.
- Added redaction and connector integration checks.

# Files Changed

See final Sprint 26G closeout.

# Commands Executed

See final Sprint 26G closeout.

# Test Results

Pending final check run.

# Risk Notes

- WSL state may contain sensitive task/session material, so task extraction is intentionally conservative.
- If no safe task source is found, tasks remain empty and a warning is reported.

# Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-26G/README.md`
- `apps/dashboard/data/generated/wsl-openclaw-local-export-adapter-report.json`

# Adapter Notes

The adapter accepts only a specific WSL OpenClaw state directory pattern and rejects sensitive-looking paths.

# Safety Notes

No production interface, external interface, restart, mutation, deploy, request auth header, sign-in material include, environment secret file, or local runtime patching is introduced.

# Reviewer Notes

Pending reviewer sign-off.
