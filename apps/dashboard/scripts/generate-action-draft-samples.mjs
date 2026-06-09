import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "action-drafts.sample.json");

const context = vm.createContext({ window: {}, console, Date });
for (const file of [
  "src/lib/rbac/permissions.js",
  "src/lib/rbac/roles.js",
  "src/lib/rbac/rbac-policy.js",
  "src/lib/rbac/rbac-state.js",
  "src/lib/action-drafts/action-draft-types.js",
  "src/lib/action-drafts/action-draft-builder.js",
  "src/lib/action-drafts/action-draft-validation.js"
]) {
  vm.runInContext(await readFile(join(dashboardRoot, file), "utf8"), context, { filename: file });
}

const dashboardExport = JSON.parse(await readFile(join(dashboardRoot, "data", "dashboard-export.sample.json"), "utf8"));
const review = dashboardExport.reviews[0];
const backup = dashboardExport.backups[0];
const settings = dashboardExport.settings;
const builder = context.window.OpenClawActionDraftBuilder;
const validation = context.window.OpenClawActionDraftValidation;

const drafts = [
  builder.buildReviewDecisionDraft(review, "approve", "reviewer"),
  builder.buildReviewDecisionDraft(review, "reject", "reviewer"),
  builder.buildReviewDecisionDraft(review, "needs_changes", "reviewer"),
  builder.buildBackupVerificationDraft(backup, "operator"),
  builder.buildSettingsChangeRequestDraft(settings, "admin"),
  builder.buildExportSnapshotDraft("admin")
];

const result = validation.validateActionDraftList(drafts);
if (!result.ok) {
  console.error("OpenClaw action draft sample generation failed.");
  result.issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({
  schemaVersion: "action-drafts-sample-v1",
  generatedAt: new Date().toISOString(),
  source: "local-script-only",
  safetyMode: "read-only",
  productionWiring: "disabled",
  mutationEnabled: false,
  drafts
}, null, 2)}\n`, "utf8");

console.log("OpenClaw action draft samples generated.");
