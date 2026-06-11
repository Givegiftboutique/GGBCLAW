# OpenClaw Dashboard Provider Balance Center

Sprint 25C adds a local-only balance center for:

- QWE API
- Huawei LLM Agent
- Intenext Codex

## Safe Input

Use the template:

`apps/dashboard/data/local/provider-balance-center.template.json`

Operators may copy it locally to:

`apps/dashboard/data/local/provider-balance-center.json`

The real local file is ignored and must not be committed.

## What It Does

- Shows provider name, balance status, last checked time, and operator notes.
- Marks missing local data as `unknown`.
- Applies redaction and reports `rawSecretsPrinted: false`.

## What It Does Not Do

- It does not store passwords or API keys in the repo.
- It does not display full API keys.
- It does not log in to provider consoles.
- It does not scrape wallet pages.
- It does not make remote balance requests.

Automatic provider balance lookup requires a future dedicated security sprint with official read-only API documentation.

## Report

`apps/dashboard/data/generated/provider-balance-center-report.json`
