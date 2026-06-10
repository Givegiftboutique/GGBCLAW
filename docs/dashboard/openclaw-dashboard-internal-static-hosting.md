# OpenClaw Dashboard Internal Static Hosting Dry Run

Scope: Internal Operator Beta only. Production remains `no-go-for-production`.

## Purpose

This dry run checks whether the dashboard can be served as local/static files before any internal hosting handoff. It does not deploy, proxy, connect production Gateway, or enable mutation.

## Local Static Preview

Run from the repository root:

```bash
node apps/dashboard/scripts/start-internal-static-preview.mjs --port 5180
```

Open:

```text
http://127.0.0.1:5180/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
http://127.0.0.1:5180/?source=gateway-stub#/dashboard/help
http://127.0.0.1:5180/?source=gateway-stub#/dashboard/observability
```

The preview server binds to `127.0.0.1` by default, serves only `apps/dashboard`, blocks path traversal, returns `404` for missing files, and returns `405` for unsupported methods.

Safety response headers:

```text
X-OpenClaw-Safety-Mode: read-only
X-OpenClaw-Production-Wiring: disabled
X-OpenClaw-Mutation-Enabled: false
```

## Dry Run Command

```bash
node apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs
```

Report path:

```text
apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json
```

The report checks required static files, generated reports, local release index, no absolute machine paths, no secrets, no production endpoint, no mutation endpoint, no `.github/workflows`, and no large release bundle.

## Not Allowed

- public production hosting
- production deploy
- production API or Gateway
- mutation endpoint
- secrets in frontend
- Authorization header
- `credentials: "include"`
- token or cookie handling
- GitHub Actions deployment
- webhook, email, Slack, or SMS delivery

## Troubleshooting

If the browser cannot load `file://`, use the local preview server above. If port `5180` is busy, choose another local port with `--port`, then keep host as `127.0.0.1`.

## Rollback

Use Git tag based rollback manually from Git Bash or VS Code terminal. Do not use `git add .`; review changed files precisely before commit or tag.
