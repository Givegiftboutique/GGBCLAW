---
task_id: TASK-20260609-OC-DASH-25E
title: OpenClaw Dashboard Operator Console Visual Redesign and Full UX Audit
status: completed
scope: local-only-dashboard-ux
production_status: no-go-for-production
---

## Summary

Sprint 25E redesigns the Dashboard as a Chinese-first operator console with modern layout, command center cards, work queue task cards, Agent status cards, safe review/RBAC simulation, and collapsed technical details.

## Acceptance Criteria

- Operator console design system exists.
- Main routes use Chinese-first operator page titles.
- Tasks use work queue cards instead of spreadsheet-first layout.
- Agents use status overview layout.
- Reviews/RBAC avoid raw permission dump in primary UI.
- Balance center and hourly refresh use modern status cards.
- Technical details are collapsed by default.
- Production guardrails remain disabled.
- Quality gate, safety scan, and verifier cover Sprint 25E.

## Commands Executed

- `node apps/dashboard/scripts/test-operator-console-visual-ux.mjs`
- `node apps/dashboard/scripts/generate-operator-console-visual-audit-checklist.mjs`
- `node apps/dashboard/scripts/test-chinese-operator-ux-copy.mjs`
- `node apps/dashboard/scripts/test-operator-ux-task-refresh-balance.mjs`
- `node apps/dashboard/scripts/run-local-operator-rc-audit.mjs`
- `node apps/dashboard/scripts/test-local-operator-rc-audit.mjs`
- `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `node apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `node apps/dashboard/verify-dashboard.mjs`

## Safety Notes

No production API, production Gateway, endpoint input, sign-in credential input, mutation, restart, deploy, provider external account access, WhatsApp API, secrets, or local credential files are introduced.

## Reviewer Notes

Manual visual audit should confirm all routes feel modern, readable, and operator-first before RC2.
