# Dashboard Agent Registry v1

## Agents

- Orchestrator Agent: routes tasks, coordinates RAG, retry, and cancel planning.
- Research Agent: gathers references and builds evidence bundles.
- Spec Agent: defines schema, API contracts, UI specs, and acceptance criteria.
- Builder Agent: implements scaffold, code patches, and task changes.
- Reviewer Agent: performs code review, policy gate checks, and test review.
- Release Agent: prepares PR notes, release notes, and CI handoff.
- Monitor Agent: watches SLA, health, lost tasks, and alert state.
- Backup Audit Agent: tracks export, checksum, backup verification, and restore drills.

## Required Fields

- role
- responsibilities
- allowed actions
- denied actions
- workspace scope
- tool profile
- risk level

## Registry Rules

- Registry data must be typed and centralized.
- Agents may expose mock actions, but production mutations must remain disabled.
- Denied actions must be visible in the detail panel.
- Risk levels must be visible for operational scanning.
