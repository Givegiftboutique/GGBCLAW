# OPENCLAW GGB Codex Notes

This repository currently contains the Phase 00 / Phase 01 OpenClaw Dashboard scaffold.

## Operating Rules

- Keep the dashboard scaffold mock-only and read-only.
- Do not add secrets, tokens, cookies, passwords, production gateway URLs, or deploy credentials.
- Do not wire UI actions to production mutation endpoints.
- Keep task memory in `ops/tasks/TASK-*.md`.
- Keep dashboard specifications in `docs/dashboard/` and operational specs in `ops/specs/`.
- Store task artifacts under `artifacts/<TASK_ID>/`.

## Dashboard Scope

The dashboard is an operations-plane scaffold for:

- Overview
- AI agent registry
- Task queue and workflow
- Review gate
- Logs and trace viewer
- KPI and analytics metrics
- Read-only settings and config guard
- RBAC / permission overview
- Backup / export / restore evidence chain
- Markdown task changelog system

Production OpenClaw runtime, secret management, and deployment workflow are explicitly out of scope for this scaffold.
