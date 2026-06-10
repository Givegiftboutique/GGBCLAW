# OpenClaw Dashboard Security Privacy Audit

Scope: Internal Operator Beta security/privacy readiness review. This is not a legal compliance certification.

## Purpose

The audit answers local beta questions:

- Are secrets present?
- Are production endpoints present?
- Is auth/token/cookie handling present?
- Are mutation routes present?
- Is external notification delivery present?
- Do generated reports expose absolute paths, private data, or raw logs?

## Commands

```bash
node apps/dashboard/scripts/generate-security-privacy-audit.mjs
node apps/dashboard/scripts/test-generated-report-sanitization.mjs
node apps/dashboard/scripts/test-security-privacy-audit.mjs
```

Report path:

```text
apps/dashboard/data/generated/security-privacy-audit-report.json
```

## What Is Checked

- secret-like values
- auth header usage
- credentialed browser requests
- browser storage and session handling
- runtime config references
- production endpoints
- mutation endpoints
- external notification delivery
- workflow/deploy paths
- machine-local paths
- PII-like values
- generated report sanitization

## What Is Not Certified

This does not certify production compliance, privacy law compliance, penetration testing, real auth security, production gateway security, or incident response readiness.

## Before Sharing

Run the audit and sanitization test, inspect warnings, and confirm generated reports contain no private data. Keep production `no-go-for-production`, `read-only`, `mutationEnabled false`, and `productionWiring disabled`.
