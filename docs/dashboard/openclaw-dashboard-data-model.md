# OpenClaw Dashboard Data Model

## AgentRecord

- `id`: stable agent identifier
- `name`: display name
- `role`: operational role
- `runtime`: execution runtime
- `model`: model or model family
- `workspace`: workspace scope
- `sandbox`: sandbox profile
- `toolsProfile`: allowed tool group
- `status`: `online | busy | degraded | offline`
- `lastHeartbeat`: ISO timestamp
- `riskLevel`: `low | medium | high`
- `responsibilities`: list of responsibilities
- `allowedActions`: list of allowed actions
- `deniedActions`: list of denied actions

## TaskRun

- `id`
- `workflow`
- `status`: `queued | running | review_pending | succeeded | failed | timed_out | cancelled | lost`
- `priority`: `P0 | P1 | P2 | P3`
- `attempt`
- `ownerAgent`
- `reviewer`
- `createdAt`
- `updatedAt`
- `summary`

## TaskAttempt

- `id`
- `taskId`
- `agentId`
- `startedAt`
- `endedAt`
- `result`
- `diffSummary`
- `testResults`

## ReviewGate

- `id`
- `taskId`
- `reviewer`
- `verdict`: `pending | approved | rejected | needs_changes`
- `policyChecks`
- `notes`
- `createdAt`

## ArtifactBundle

- `id`
- `taskId`
- `path`
- `kind`
- `checksum`
- `createdAt`

## BackupManifest

- `id`
- `taskId`
- `verifyStatus`
- `checksum`
- `storageUri`
- `createdAt`
- `restoreTestedAt`
- `evidenceChain`

## AuditEvent

- `id`
- `timestamp`
- `severity`
- `actor`
- `event`
- `redacted`
- `taskId`
- `agentId`

## DashboardMetric

- `id`
- `label`
- `value`
- `trend`
- `status`
- `description`

## DashboardSettings

- `gatewayAuthMode`
- `retentionPolicy`
- `modelRouting`
- `mcpServers`
- `secretRefsHealth`
- `productionMutation`

## RbacSummary

- `agentId`
- `name`
- `riskLevel`
- `allowedActions`
- `deniedActions`

## DashboardDataAdapter

Phase 02 introduces a read-only adapter interface. UI views should read through this interface rather than importing raw mock arrays.

- `getMetrics()`
- `getAgents()`
- `getAgentById(id)`
- `getTasks(filters?)`
- `getTaskById(id)`
- `getReviews(filters?)`
- `getLogs(filters?)`
- `getBackups()`
- `getSettings()`
- `getRbacSummary()`

Mutation methods are intentionally excluded from the adapter surface.

## DashboardSourceConfig

Phase 03 adds local source selection.

- `requestedSource`
- `source`: `mock | json | artifact`
- `dataUrl`
- `fallbackSource`

## DashboardSourceStatus

- `currentSource`
- `requestedSource`
- `health`: `ok | warning | error`
- `validation`: `passed | failed`
- `fallback`: `none | mock`
- `fallbackReason`
- `lastLoadedAt`
- `dataUrl`

## ArtifactManifest

- `manifestId`
- `createdAt`
- `checksum`
- `verifyStatus`
- `artifactRefs`
- `dashboardData`

## DashboardExport Metadata

Phase 04 generated snapshots include:

- `schemaVersion`: `dashboard-export-v1`
- `generatedAt`
- `source`
- `generatorVersion`
- `safetyMode`: `read-only`
- `mutationEnabled`: `false`

Generated exports also include `rbac`, `sourceStatus`, and `artifacts` sections for reset/replay and evidence-chain review.
