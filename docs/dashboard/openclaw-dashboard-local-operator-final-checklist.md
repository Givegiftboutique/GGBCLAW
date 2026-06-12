# OpenClaw Dashboard Local Operator Final Checklist

## Purpose

The final local operator checklist gives the operator a last local-use checklist before treating the Dashboard as the daily local checkpoint.

## Checklist

- Start Dashboard with `apps/dashboard/scripts/start-operator-dashboard.ps1`.
- Confirm Operator Home is visible.
- Confirm Daily Operator Runbook is visible.
- Confirm Local Health panel is visible.
- Confirm Evidence panel is visible.
- Confirm Reviewed Health Input Assistant is visible.
- Confirm Production Entry Gate is visible.
- Confirm Production Adapter Simulator is visible.
- Confirm Read-only Adapter Contract Review is visible.
- Confirm Disabled Adapter Draft is visible.
- Confirm Dashboard Stabilization Audit is visible.
- Confirm Local Operator Release Candidate panel is visible.
- Confirm 今日任務 panel is visible.
- Confirm WhatsApp 任務同步 status is visible.
- Confirm 每 1 小時自動刷新, 上次刷新, 下次刷新時間, and 立即刷新 are visible.
- Confirm 用量與餘額中心 is visible with QWE API, Huawei LLM Agent, and Intenext Codex.
- Confirm source is `local-ingest` single-agent.
- Confirm agent count is 1.
- If 8 agents appear, treat the view as fixture/demo data.

## Not Allowed

- production gateway connection
- mutation
- restart / stop / start
- deploy
- auth/token/secrets
- committing `reviewed-local-agent-health.json`
- committing `operator-task-inbox.json`
- committing `provider-balance-center.json`
- storing passwords, API keys, tokens, cookies, or credentials in the repo

## Report Path

```text
apps/dashboard/data/generated/local-operator-final-checklist.json
```

## Sprint 25D Chinese-first copy hardening

The Dashboard main surfaces now use Chinese-first operator language. Engineering enum values, raw keys, report paths, and permission keys are still available for review, but should be shown inside collapsed `技術詳情` / technical detail sections instead of the primary operator view. Production remains `no-go-for-production`; no production API/Gateway, endpoint input, auth/token input, mutation, restart, deploy, WhatsApp API, provider login, or secret handling is added.

## Sprint 25E Operator console visual redesign

Before RC2, confirm the Sprint 25E visual audit checklist is generated and every main route uses the operator console layout. Technical details should be collapsed by default and no unsafe buttons should exist.
