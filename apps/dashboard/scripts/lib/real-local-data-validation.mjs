import { readFile } from "node:fs/promises";
import { containsUnsafeValue } from "./real-local-data-sanitizer.mjs";

export function validatePilotEnvelope(payload) {
  const issues = [];
  if (!payload || typeof payload !== "object") issues.push("payload must be an object");
  if (payload?.safetyMode !== "read-only" && payload?.source?.safetyMode !== "read-only" && payload?.metadata?.safetyMode !== "read-only") issues.push("safetyMode must be read-only");
  if (payload?.mutationEnabled !== false && payload?.source?.mutationEnabled !== false && payload?.metadata?.mutationEnabled !== false) issues.push("mutationEnabled must be false");
  if (payload?.productionWiring !== "disabled" && payload?.source?.productionWiring !== "disabled" && payload?.sourceStatus?.productionWiring !== "disabled") issues.push("productionWiring must be disabled");
  if (containsUnsafeValue(payload)) issues.push("payload contains unsafe value");
  return { ok: issues.length === 0, issues };
}

export async function assertGeneratedFileSafe(filePath) {
  const body = await readFile(filePath, "utf8");
  if (containsUnsafeValue(body)) {
    throw new Error(`${filePath} contains unsafe value`);
  }
  return JSON.parse(body);
}

export function validateDashboardSnapshotShape(snapshot) {
  const issues = [];
  for (const key of ["metrics", "agents", "tasks", "reviews", "logs", "backups"]) {
    if (!Array.isArray(snapshot[key])) issues.push(`${key} must be an array`);
  }
  if (!snapshot.settings || typeof snapshot.settings !== "object") issues.push("settings must be an object");
  if (!snapshot.rbac) issues.push("rbac must be present");
  if (snapshot.source?.safetyMode !== "read-only") issues.push("source safetyMode must be read-only");
  if (snapshot.source?.mutationEnabled !== false) issues.push("source mutationEnabled must be false");
  if (snapshot.source?.productionWiring !== "disabled") issues.push("source productionWiring must be disabled");
  return { ok: issues.length === 0, issues };
}
