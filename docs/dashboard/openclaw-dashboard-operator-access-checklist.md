# OpenClaw Dashboard Operator Access Checklist

Scope: Internal Operator Beta. Production remains `no-go-for-production`.

## Generate Checklist

```bash
node apps/dashboard/scripts/generate-operator-access-checklist.mjs
```

Report path:

```text
apps/dashboard/data/generated/operator-access-checklist.json
```

## Browser URLs

```text
http://127.0.0.1:5180/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
http://127.0.0.1:5180/?source=gateway-stub#/dashboard/help
http://127.0.0.1:5180/?source=gateway-stub#/dashboard/observability
```

## Operator Checks

- Confirm the URL is local/internal only.
- Confirm source badge matches the intended source mode.
- Confirm safety mode is `read-only`.
- Confirm `mutationEnabled false`.
- Confirm `productionWiring disabled`.
- Confirm production status is `no-go-for-production`.
- Confirm no auth, token, cookie, password, or API key is required.
- Confirm no external alert delivery is available.
- Confirm daily workflow can generate local evidence.
- Confirm incident drill can generate local scenarios.
- Confirm evidence manifest can be generated.
- Confirm rollback owner knows the manual Git tag process.

## Not Allowed

- production deploy
- public hosting without approval
- production API or Gateway
- mutation endpoint
- Authorization header
- `credentials: "include"`
- token/cookie handling
- webhook/email/Slack/SMS delivery

## Sign-off Placeholder

Operator:

Reviewer:

Date:

Notes:
