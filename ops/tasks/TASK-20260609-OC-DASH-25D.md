---
task_id: TASK-20260609-OC-DASH-25D
title: OpenClaw Dashboard Chinese-first Operator UX Copy Hardening
status: complete
scope: local-operator-dashboard
production_status: no-go-for-production
---

# Summary

Sprint 25D hardens the Dashboard copy so the main operator surfaces use clear Chinese wording instead of raw engineering enum values.

# Acceptance Criteria

- Chinese-first page titles exist.
- Agents page is `Agent 狀態`.
- Tasks page is `今日任務`.
- Reviews page is `安全審查`.
- Raw keys are moved into `技術詳情`.
- Production guardrails remain disabled.

# Execution Plan

1. Extend operator copy dictionary.
2. Update Dashboard UI main panels.
3. Add copy coverage test.
4. Update quality gate, safety scan, and verifier.
5. Update docs and manual smoke coverage.

# Execution History

- Updated operator copy helpers.
- Converted Agent, Tasks, Reviews, RBAC, and header copy to Chinese-first wording.
- Added collapsed technical detail areas for raw values.
- Added Chinese operator UX copy test.

# Files Changed

See git commit for the final staged file list.

# Commands Executed

Recorded in the Sprint 25D closeout response.

# Test Results

Recorded in the Sprint 25D closeout response.

# Safety Notes

No production API, Gateway, endpoint, auth or browser credential storage, mutation, restart, deploy, or secret handling was added.

# Reviewer Notes

Placeholder for manual review.