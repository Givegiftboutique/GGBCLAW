# OpenClaw Dashboard Action Drafts

Task: `TASK-20260609-OC-DASH-11A`

Action drafts are local JSON previews for operator review. They are not submitted and do not execute approve, reject, backup, restore, settings update, gateway write, or production mutation behavior.

## Draft Types

- `review_decision_draft`
- `backup_verification_draft`
- `settings_change_request_draft`
- `export_snapshot_draft`

## Required Safety Flags

Every draft must include:

```json
{
  "dryRun": true,
  "mutationEnabled": false,
  "productionWiring": "disabled",
  "requiresHumanApproval": true,
  "notSubmitted": true
}
```

## UI Flows

- Reviews: generate approve, reject, or needs changes draft preview.
- Backups: generate backup verification draft preview.
- Settings: generate settings change request draft preview.
- Runbook: documents commands and safety boundaries.

Draft preview uses selectable JSON text. The browser does not write files. The generated sample file is created only by the local script.

## Generated Sample

```bash
node apps/dashboard/scripts/generate-action-draft-samples.mjs
```

Output:

```text
apps/dashboard/data/generated/action-drafts.sample.json
```

## Local Test

```bash
node apps/dashboard/scripts/test-action-drafts.mjs
```

Expected:

```text
OpenClaw action draft tests passed.
```

Do not use the sample generator to hide unsafe draft data. Fix the draft builder or validation issue first.
