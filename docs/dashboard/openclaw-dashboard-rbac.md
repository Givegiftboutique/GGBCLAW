# OpenClaw Dashboard RBAC Stub

Task: `TASK-20260609-OC-DASH-11A`

This is a local role simulation for dashboard acceptance only. It is not real authentication, not a login system, and not a production authorization layer.

## Roles

- `viewer`: view dashboard routes and source status.
- `operator`: view operations state and generate backup verification drafts.
- `reviewer`: view reviews and generate review decision drafts.
- `admin`: view local config guardrails and generate local draft artifacts.
- `audit-only`: inspect evidence and policy state without draft permissions.

## Permissions

The simulated permission model includes view permissions plus draft-only permissions such as `reviews:draft_decision`, `backups:draft_verification`, `exports:generate_local_snapshot`, `quality:run_local_gate`, and `admin:view_config`.

Forbidden non-goal permissions are listed only as blocked policy markers:

- `reviews:approve`
- `reviews:reject`
- `backups:restore`
- `settings:update`
- `gateway:write`
- `production:mutate`

No role grants these forbidden permissions.

## Safety Rules

- simulated only
- no real auth
- no real login
- no token
- no cookie
- no production permissions
- memory-only role state

The role selector in the Dashboard changes in-memory display state only. It must not write browser storage, send network calls, or mutate reviews, backups, settings, or gateway state.

## Local Test

```bash
node apps/dashboard/scripts/test-rbac-policy.mjs
```

Expected:

```text
OpenClaw RBAC policy tests passed.
```
