# OpenClaw Dashboard Operator UX Polish

Sprint 25C makes the local operator dashboard easier to read for non-engineering users.

This is local-only usability work. It is not production, not a gateway sprint, and not an auth or secrets sprint.

## What Changed

- The first screen now prioritizes 今日任務, Agent 狀態, 用量與餘額, 最後刷新, Production 安全鎖, and 已知風險.
- Panels use plain Chinese operator wording before technical report paths.
- Technical enums remain available as evidence, but each new panel explains what it means and what the operator should do next.

## Safety

- `productionReady` remains false.
- Production status remains `no-go-for-production`.
- Mutation, restart, deploy, and production gateway connection remain disabled.
- Do not paste API keys, passwords, tokens, cookies, or credentials into Codex, docs, reports, or committed files.

## Reports

- `apps/dashboard/data/generated/local-task-inbox-report.json`
- `apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json`
- `apps/dashboard/data/generated/hourly-refresh-policy-report.json`
- `apps/dashboard/data/generated/provider-balance-center-report.json`

## Sprint 25D Chinese-first copy hardening

The Dashboard main surfaces now use Chinese-first operator language. Engineering enum values, raw keys, report paths, and permission keys are still available for review, but should be shown inside collapsed `技術詳情` / technical detail sections instead of the primary operator view. Production remains `no-go-for-production`; no production API/Gateway, endpoint input, auth/token input, mutation, restart, deploy, WhatsApp API, provider login, or secret handling is added.
