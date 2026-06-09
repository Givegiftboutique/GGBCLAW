import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const context = vm.createContext({ window: {}, console });

for (const file of [
  "src/lib/rbac/permissions.js",
  "src/lib/rbac/roles.js",
  "src/lib/rbac/rbac-policy.js",
  "src/lib/rbac/rbac-state.js"
]) {
  vm.runInContext(await readFile(join(dashboardRoot, file), "utf8"), context, { filename: file });
}

const issues = [];
const requiredRoles = ["viewer", "operator", "reviewer", "admin", "audit-only"];
const requiredPermissions = [
  "dashboard:view",
  "agents:view",
  "tasks:view",
  "reviews:view",
  "logs:view",
  "backups:view",
  "settings:view",
  "rbac:view",
  "runbook:view",
  "reviews:draft_decision",
  "backups:draft_verification",
  "exports:generate_local_snapshot",
  "quality:run_local_gate",
  "admin:view_config"
];
const forbidden = ["reviews:approve", "reviews:reject", "backups:restore", "settings:update", "gateway:write", "production:mutate"];

const roles = context.window.OpenClawRbacRoles;
const permissions = context.window.OpenClawRbacPermissions;
const policy = context.window.OpenClawRbacPolicy;
const state = context.window.OpenClawRbacState;

for (const role of requiredRoles) {
  if (!roles.ROLE_IDS.includes(role)) issues.push(`missing role ${role}`);
  if (!roles.ROLE_DEFINITIONS[role]) issues.push(`missing role definition ${role}`);
}

for (const permission of requiredPermissions) {
  if (!permissions.REQUIRED_PERMISSIONS.includes(permission)) issues.push(`missing required permission ${permission}`);
}

for (const role of requiredRoles) {
  for (const permission of roles.ROLE_DEFINITIONS[role].permissions) {
    if (forbidden.includes(permission)) issues.push(`${role} grants forbidden mutation permission ${permission}`);
  }
}

const policyResult = policy.validateRbacPolicy();
if (!policyResult.ok) issues.push(...policyResult.issues);
if (policy.getRoleMatrix().length !== requiredRoles.length) issues.push("role matrix has unexpected length");
if (!policy.SAFETY_MARKERS.includes("simulated only")) issues.push("policy missing simulated only marker");
if (!policy.SAFETY_MARKERS.includes("no token")) issues.push("policy missing no token marker");
if (!policy.SAFETY_MARKERS.includes("no cookie")) issues.push("policy missing no cookie marker");

state.setCurrentRole("reviewer");
const roleState = state.getCurrentRoleState();
if (roleState.storage !== "memory-only") issues.push("simulated role state must be memory-only");
if (!roleState.safetyNotes.includes("no production permissions")) issues.push("simulated role missing no production permissions marker");

const stateBody = await readFile(join(dashboardRoot, "src/lib/rbac/rbac-state.js"), "utf8");
if (/localStorage|sessionStorage|document\.cookie/.test(stateBody)) issues.push("RBAC state must not persist to browser storage or cookies.");

if (issues.length) {
  console.error("OpenClaw RBAC policy tests failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log("OpenClaw RBAC policy tests passed.");
