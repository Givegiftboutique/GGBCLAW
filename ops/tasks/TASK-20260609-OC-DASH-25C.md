---
task_id: TASK-20260609-OC-DASH-25C
title: Operator UX + Task Visibility + Hourly Refresh + Balance Center
status: implemented
scope: local-only-operator-usability
production_status: no-go-for-production
---

# Summary

Sprint 25C improves the local operator dashboard for non-engineering users. It adds clear Chinese first-screen panels, local task inbox visibility, WhatsApp task sync visibility, hourly local refresh policy, and a local-only provider balance center.

# Acceptance Criteria

- Operator UX copy module exists.
- Local task inbox module, templates, and report exist.
- WhatsApp visibility checklist exists.
- Hourly refresh policy module and report exist.
- Provider balance center module, templates, and report exist.
- UI markers for 今日任務, 每 1 小時自動刷新, and 用量與餘額中心 are visible.
- Production remains `no-go-for-production`.
- No production gateway, mutation, restart, deploy, sign-in, session-secret, or credential handling is added.

# Execution Plan

1. Add local-only modules and templates.
2. Add report generators.
3. Add first-screen operator panels.
4. Update RC audit, quality gate, safety scan, and verifier.
5. Update docs and manual smoke tests.
6. Run required checks and close with precision Git handling.

# Execution History

- Added task inbox, WhatsApp visibility, hourly refresh, and provider balance report generators.
- Added UI panels with plain Chinese operator wording.
- Added docs and task artifacts.

# Files Changed

See Git commit for final precision-staged files.

# Commands Executed

To be recorded after final checks.

# Test Results

To be recorded after final checks.

# Risk Notes

- WhatsApp is not directly connected; missing WhatsApp tasks are expected until a safe local export exists.
- Provider balance values are manual/local-only and may remain unknown.
- Automatic provider balance lookup requires a separate security-approved sprint.

# Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-25C/README.md`

# Safety Notes

- Do not commit `operator-task-inbox.json`.
- Do not commit `provider-balance-center.json`.
- Do not commit `reviewed-local-agent-health.json`.
- Do not store passwords, API keys, session secrets, browser session data, request auth headers, or credentials.

# Reviewer Notes

Reviewer notes placeholder.
