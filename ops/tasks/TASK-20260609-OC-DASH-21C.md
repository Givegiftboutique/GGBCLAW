---
task: TASK-20260609-OC-DASH-21C
title: OpenClaw Dashboard Real Local Snapshot Cleanup to One Agent
status: implemented
date: 2026-06-10
scope: dashboard
safety_mode: read-only
production_status: no-go-for-production
mutation_enabled: false
production_wiring: disabled
---

# Summary

Sprint 21C aligns the real local operator truth candidate snapshot to the current expected real agent count of 1 while preserving mock and gateway-stub 8-agent fixtures for lifecycle and contract coverage.

# Acceptance Criteria

- Real local agent inventory inspector exists.
- Single-agent local snapshot generator exists.
- Single-agent local snapshot test exists.
- Single-agent generated snapshot contains exactly 1 agent.
- Single-agent truth report passes when pointed at the single-agent snapshot.
- Mock and gateway-stub remain fixture only.
- Production remains `no-go-for-production`.

# Execution Plan

1. Inspect the existing 5-agent generated real local snapshot.
2. Generate a separate single-agent snapshot.
3. Update truth reporting to accept `--data`.
4. Add regression tests and quality gate coverage.
5. Update UI, docs, safety scan, and verifier coverage.

# Execution History

- Added local inventory inspection report generator.
- Added single-agent local snapshot generator.
- Updated single-agent truth report to support explicit data path.
- Added single-agent snapshot regression test.
- Added UI markers for actual real agent count and review-required state.

# Files Changed

See Git diff for final file list.

# Commands Executed

To be filled with final run output summary.

# Test Results

To be filled after final quality gate and browser checks.

# Risk Notes

- The single-agent snapshot is still review-required.
- The original 5-agent generated snapshot remains review evidence only.
- Fixture sources must not be promoted to operator truth.

# Artifact Refs

- `apps/dashboard/data/generated/real-local-agent-inventory-inspection.json`
- `apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json`
- `apps/dashboard/data/generated/single-agent-truth-report.json`
- `artifacts/TASK-20260609-OC-DASH-21C/README.md`

# 5-agent Warning Notes

The previous generated real local snapshot contained 5 agents. It must not be treated as current operator inventory.

# Single-agent Cleanup Notes

The cleanup selects a deterministic validation-safe candidate and records rejected candidates for review.

# Operator Truth Notes

`local-ingest` is an operator truth candidate only after validation and human review. Expected real agent count is 1.

# Safety Notes

No production API, production Gateway, mutation endpoint, auth/token/cookie handling, deploy workflow, or CI was added.

# Reviewer Notes

Pending manual reviewer notes.
