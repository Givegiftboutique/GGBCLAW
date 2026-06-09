# OpenClaw Dashboard Design

## Purpose

The OpenClaw Dashboard is a read-only operations console for OPENCLAW GGB. It gives operators a single place to inspect agent health, task workflow state, review gates, traces, KPIs, backups, settings, and Markdown task memory.

This scaffold is intentionally mock-only. It does not replace the production OpenClaw runtime and does not mutate production state.

## Information Architecture

- `/dashboard`: operational overview and recent activity
- `/dashboard/agents`: AI agent registry and responsibility profiles
- `/dashboard/tasks`: task queue, lifecycle, filters, and detail panel
- `/dashboard/reviews`: review gate list and mock verdict controls
- `/dashboard/logs`: trace and log viewer with redaction indicators
- `/dashboard/backups`: backup manifests and evidence chain
- `/dashboard/settings`: read-only config guard, auth mode, retention, model routing, MCP servers, and SecretRef health
- `/dashboard/rbac`: permission overview and denied-action matrix

## Experience Principles

- Dense, calm SaaS admin console.
- Persistent sidebar and status bar.
- Tables for operational scanning.
- Compact KPI cards for health signals.
- Detail panels for context without navigation churn.
- Explicit read-only and mock-action labels.
- Empty, loading, and error states available on every route.

## Safety Boundaries

- No secrets in UI, docs, mock data, or artifacts.
- No production gateway endpoint.
- No deploy workflow.
- No live backup, restore, approval, rejection, retry, or cancellation action.
- Disabled controls are allowed to communicate future capability.
