# OpenClaw Dashboard Known Risk Register

## Purpose

Sprint 25B records known local-only operator risks so daily users do not mistake the Dashboard for a production-ready system.

## Known Risks

- Real reviewed health input remains local-only.
- Health may be unknown, stale, or review-required.
- Production adapter remains disabled.
- No production endpoint or auth is available.
- Browser cache can show an old mock view.
- Local server port may be occupied.
- Manual browser console checks may be unavailable.
- Fixture sources remain available for demo and contract tests only.

## Blocked Production Risks

- production gateway connection
- production endpoint configuration
- auth/token handling
- mutation or restart actions
- deploy or CI automation
- `productionReady: true`

## Report Path

```text
apps/dashboard/data/generated/local-operator-known-risk-register.json
```

Production remains `no-go-for-production`.
