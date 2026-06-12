# OpenClaw Dashboard Chinese Operator UX Copy Hardening

Sprint 25D turns the Dashboard main screens from engineering-oriented labels into Chinese-first operator language.

This is a local operator usability sprint only. It is not a production sprint and it does not connect to any production API, Gateway, provider wallet, WhatsApp API, endpoint, auth surface or browser credential storage, or secret.

## What Changed

- Main page titles now use Chinese operator wording such as `Agent 狀態`, `今日任務`, and `安全審查`.
- Raw technical values are kept for review but moved into collapsed `技術詳情` sections.
- Agents now focus on what the operator sees: current Agent count, local source, health, evidence, Production lock, and next review step.
- Tasks now focus on what to do today: task counts, readable statuses, WhatsApp sync visibility, and safe next steps.
- Reviews and RBAC now explain permission simulation in plain Chinese and keep raw permission keys in technical details.

## Guardrails

- Production remains `no-go-for-production`.
- `productionReady`, adapter, endpoint, auth, connection, and data-return flags remain false.
- Mutation, restart, deploy, and production gateway actions remain disabled.
- Secrets, API keys, browser credential values remain forbidden.

## Sprint 25E Follow-up

Sprint 25E extends this copy hardening into a full operator console visual redesign. The default experience is command-center-first with work queue cards, Agent status cards, Balance / Refresh cards, and collapsed technical details.
