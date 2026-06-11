# OpenClaw Dashboard Local Task Inbox

Sprint 25C adds a local-only task inbox so operators can see whether tasks have entered the dashboard.

## Safe Input

Use the template:

`apps/dashboard/data/local/operator-task-inbox.template.json`

Operators may copy it locally to:

`apps/dashboard/data/local/operator-task-inbox.json`

The real local file is ignored and must not be committed.

## WhatsApp

WhatsApp tasks do not appear automatically yet. If no WhatsApp tasks are shown, it means no safe local task export has been written to the inbox. It does not mean the dashboard is broken.

Future WhatsApp integration needs a separate security-approved sprint.

## Safety

- The task inbox is local-only.
- It does not call WhatsApp.
- It does not store tokens, cookies, API keys, passwords, or credentials.
- It does not mutate tasks in production.

## Report

`apps/dashboard/data/generated/local-task-inbox-report.json`
