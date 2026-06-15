# OpenClaw Dashboard WhatsApp Secret Manager Design

This is a design-only document. It does not implement secret storage, token loading, or provider login.

## Scope

- Future-only planning for WhatsApp sync security.
- No real secret manager implementation.
- No `.env` reading in Dashboard scripts.
- No browser token input.
- No provider credential storage in repo.

## Safety Rules

- No secrets in repo.
- No secrets in generated reports.
- No secrets in UI.
- No secrets in logs.
- No raw private chat content.
- No raw credential values.
- No production connection.

## Future options

- OS-protected local secret store.
- Operator-managed vault integration.
- Manual redacted config import.
- Separate approval flow for any live secret handling.

## Rotation policy

- Rotate before any live sync.
- Rotate after suspected exposure.
- Rotate when a provider token is replaced.

## Logging policy

- Redacted logging policy: future logs must redact secret values, token-like strings, phone-like identifiers, and private chat content before they are written.
- Log only redacted labels.
- Never print tokens, passwords, cookies, or Authorization headers.
- Never print raw webhook payloads.

## Local dev rules

- Keep local-only inputs ignored.
- Prefer local mock fixtures.
- Use offline reports for review.
- Do not store live provider credentials in the repo.

## Production blocker checklist

- Secret manager approved.
- Redacted logging approved.
- Webhook verification approved.
- Replay protection approved.
- Retention policy approved.
- Data deletion path approved.
- Consent and privacy review approved.

## Approval gates

- Separate sprint required for any real secret use.
- Separate sprint required for any live provider credential handling.
- Separate sprint required for any live WhatsApp sync.

## Rollback plan

- Stop live sync.
- Revoke rotated credentials.
- Purge local copies.
- Return to offline local import path.
- Review logs for redacted-only output.
