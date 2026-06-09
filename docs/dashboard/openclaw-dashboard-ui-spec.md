# OpenClaw Dashboard UI Spec

## Layout

- Fixed sidebar on desktop, compact top navigation on narrow screens.
- Status bar shows environment, source, auth mode, and mutation lock.
- Main content uses responsive grids and dense tables.
- Detail panels appear inline on desktop and stack below tables on mobile.

## Routes

### `/dashboard`

- Gateway status card
- Active agents card
- Running tasks card
- Failed / lost tasks card
- Backup status card
- Recent activity list
- KPI metrics

### `/dashboard/agents`

- Agent table
- Detail panel
- Fields: id, name, role, runtime, model, workspace, sandbox, tools profile, status, last heartbeat, risk

### `/dashboard/tasks`

- Task queue table
- Status and priority filters
- Detail panel
- Lifecycle: queued, running, review_pending, succeeded, failed, timed_out, cancelled, lost

### `/dashboard/reviews`

- Review gate list
- Reviewer notes
- Mock approve/reject buttons disabled for production mutation

### `/dashboard/logs`

- Search input
- Severity filter
- Redaction badge
- Mock trace detail viewer

### `/dashboard/backups`

- Backup manifest table
- Evidence chain: git commit, artifact bundle, checksum, backup manifest

### `/dashboard/settings`

- Read-only settings
- Gateway auth mode
- Retention
- Model routing
- MCP servers
- SecretRef health
- Production mutation disabled badge

### `/dashboard/rbac`

- Permission matrix
- Allowed and denied actions by agent role

## States

Each route includes:

- Loading state
- Empty state
- Error state

The static scaffold renders mock examples of these states for design validation.
