# Dashboard Task Workflow v1

## Lifecycle

- `queued`: task accepted but not started
- `running`: active execution in progress
- `review_pending`: awaiting review gate
- `succeeded`: completed successfully
- `failed`: completed with failure
- `timed_out`: execution exceeded expected time
- `cancelled`: intentionally stopped
- `lost`: no current owner or heartbeat

## Queue Fields

- task id
- workflow
- status
- priority
- attempt
- owner agent
- reviewer
- created at
- updated at

## Review Gate

- Verdicts: `pending`, `approved`, `rejected`, `needs_changes`
- Mock buttons may be shown.
- Production approval/rejection must remain disabled in this scaffold.

## Audit

Every future mutation must write an audit event and update task memory. Phase 01 records only mock audit events.
