# OpenClaw Dashboard Operator Security Checklist

Scope: Internal Operator Beta. Production remains `no-go-for-production`.

## Command

```bash
node apps/dashboard/scripts/generate-operator-security-checklist.mjs
```

Report path:

```text
apps/dashboard/data/generated/operator-security-checklist.json
```

## Daily Security Checks

- Run quality gate, safety scan, verifier, and security privacy audit.
- Review generated reports before sharing.
- Confirm `read-only`, `mutationEnabled false`, and `productionWiring disabled`.
- Confirm production remains `no-go-for-production`.

## Before Commit

- Do not commit runtime config files.
- Do not commit secrets.
- Do not commit absolute machine paths.
- Do not commit raw logs or unreviewed private data.
- Review Git status and diff manually.

## Before Internal Hosting

- Run static hosting dry run.
- Generate operator access checklist.
- Run generated report sanitization test.
- Confirm no production Gateway, no mutation endpoint, no public hosting default.

## Before Production

Production remains blocked until formal security review, privacy review, real auth design review, production gateway security review, secrets management plan, operator signoff, and deployment ownership are complete.

## Sign-off Placeholder

Operator:

Reviewer:

Date:

Notes:
