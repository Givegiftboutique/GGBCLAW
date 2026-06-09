import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const repoRoot = resolve(here, "../../..");
const nodeExe = process.execPath;

const generator = spawnSync(nodeExe, ["apps/dashboard/scripts/generate-action-draft-samples.mjs"], {
  cwd: repoRoot,
  encoding: "utf8"
});
if (generator.status !== 0) {
  console.error(generator.stdout.trim());
  console.error(generator.stderr.trim());
  process.exit(generator.status ?? 1);
}

const context = vm.createContext({ window: {}, console, Date });
for (const file of [
  "src/lib/rbac/permissions.js",
  "src/lib/rbac/roles.js",
  "src/lib/rbac/rbac-policy.js",
  "src/lib/action-drafts/action-draft-types.js",
  "src/lib/action-drafts/action-draft-validation.js"
]) {
  vm.runInContext(await readFile(join(dashboardRoot, file), "utf8"), context, { filename: file });
}

const sample = JSON.parse(await readFile(join(dashboardRoot, "data", "generated", "action-drafts.sample.json"), "utf8"));
const issues = [];
if (sample.schemaVersion !== "action-drafts-sample-v1") issues.push("sample schemaVersion mismatch");
if (sample.safetyMode !== "read-only") issues.push("sample safetyMode must be read-only");
if (sample.productionWiring !== "disabled") issues.push("sample productionWiring must be disabled");
if (sample.mutationEnabled !== false) issues.push("sample mutationEnabled must be false");

const result = context.window.OpenClawActionDraftValidation.validateActionDraftList(sample.drafts);
if (!result.ok) issues.push(...result.issues);

const body = JSON.stringify(sample);
if (/(password|token|cookie|api[_-]?key)\s*[:=]/i.test(body)) issues.push("sample contains secret-like assignment");
if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|0\.0\.0\.0\b|dev\.local\b|openclaw-dev\.local\b)/i.test(body)) issues.push("sample contains production endpoint");
if (/\b(approveReview|rejectReview|runBackup|restoreBackup|updateSettings|mutateGateway|writeGateway)\b/i.test(body)) issues.push("sample contains active mutation method name");

for (const draft of sample.drafts ?? []) {
  if (draft.dryRun !== true) issues.push(`${draft.draftId} dryRun must be true`);
  if (draft.mutationEnabled !== false) issues.push(`${draft.draftId} mutationEnabled must be false`);
  if (draft.productionWiring !== "disabled") issues.push(`${draft.draftId} productionWiring must be disabled`);
  if (draft.notSubmitted !== true) issues.push(`${draft.draftId} notSubmitted must be true`);
  if (draft.requiresHumanApproval !== true) issues.push(`${draft.draftId} requiresHumanApproval must be true`);
}

if (issues.length) {
  console.error("OpenClaw action draft tests failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log("OpenClaw action draft tests passed.");
