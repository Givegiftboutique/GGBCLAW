# Dashboard Markdown Memory v1

## Task File Location

Each task uses:

```text
ops/tasks/TASK-*.md
```

## Required Sections

- YAML frontmatter
- Task summary
- Acceptance criteria
- Risk notes
- Execution plan
- Execution history
- Review result
- Changelog
- Artifact refs
- Backup refs

## Required Update Fields

Every active task update should refresh:

- `status`
- `updated_at`
- `diff_summary`
- `artifact_refs`
- `test_results`
- `risk_notes`

## Safety

Task memory must not contain secrets, tokens, cookies, passwords, production endpoints, or private user data.
