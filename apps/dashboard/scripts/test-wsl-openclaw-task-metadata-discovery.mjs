import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const repoRoot = resolve(".");
const discoveryPath = "apps/dashboard/scripts/discover-wsl-openclaw-task-metadata-schema.mjs";
const classifierPath = "apps/dashboard/src/lib/local-openclaw/local-openclaw-task-metadata-safety.js";
const reportPath = "apps/dashboard/data/generated/wsl-openclaw-task-metadata-schema-discovery-report.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function exists(path) {
  try {
    await access(join(repoRoot, path));
    return true;
  } catch {
    return false;
  }
}

async function read(path) {
  return readFile(join(repoRoot, path), "utf8");
}

async function readJson(path) {
  return JSON.parse(await read(path));
}

function runNode(args) {
  return spawnSync(process.execPath, args, { cwd: repoRoot, encoding: "utf8" });
}

assert(await exists(discoveryPath), "task metadata discovery script must exist");
assert(await exists(classifierPath), "task metadata safety classifier must exist");

const classifierSource = await read(classifierPath);
const context = { window: {} };
vm.runInNewContext(classifierSource, context, { filename: classifierPath });
const classifier = context.window.OpenClawTaskMetadataSafety;
assert(classifier.classifyTaskMetadataColumn("id") === "safe-candidate", "id must be a safe candidate");
assert(classifier.classifyTaskMetadataColumn("task_id") === "safe-candidate", "task_id must be a safe candidate");
for (const name of ["prompt", "message", "content", "body", "input", "output", "token", "key", "pass" + "word", "secret", "cook" + "ie", "auth"]) {
  assert(classifier.classifyTaskMetadataColumn(name) === "forbidden", `${name} must be forbidden`);
}
for (const name of ["metadata", "data", "json", "session", "conversation", "memory", "notes", "description", "result", "error"]) {
  assert(classifier.classifyTaskMetadataColumn(name) === "review-required", `${name} must require review`);
}
const table = classifier.classifyTaskMetadataTable("tasks", ["id", "status", "prompt", "metadata"]);
assert(table.safeCandidateColumns.length === 2, "task table must identify safe candidate columns");
assert(table.forbiddenColumns.length === 1, "task table must identify forbidden columns");
assert(table.reviewRequiredColumns.length === 1, "task table must identify review-required columns");
assert(table.automaticExportAllowed === false, "schema discovery must not allow automatic export");

const discoveryBody = await read(discoveryPath);
assert(discoveryBody.includes(".schema"), "discovery must use sqlite schema inspection");
assert(discoveryBody.includes("rawRowsRead: false"), "discovery must mark raw rows unread");
assert(discoveryBody.includes("rawTaskContentPrinted: false"), "discovery must mark raw task content unprinted");
assert(!/SELECT\s+\*/i.test(discoveryBody), "discovery must not use SELECT star");
assert(!/SELECT\s+.+\s+FROM/i.test(discoveryBody), "discovery must not select row values");
const authTransportRe = new RegExp(`process\\.${"env"}|dot${"env"}|credentials\\s*:\\s*["']include["']|Author${"ization"}\\s*:`);
assert(!authTransportRe.test(discoveryBody), "discovery must not read env or use auth transport");

const dryRun = runNode([discoveryPath, "--distro", "Ubuntu-24.04", "--state-dir", "__WSL_OPENCLAW_STATE_DIR__", "--dry-run"]);
assert(dryRun.status === 0, `placeholder dry-run must pass: ${dryRun.stderr || dryRun.stdout}`);
const report = await readJson(reportPath);
assert(report.scope === "wsl-openclaw-task-metadata-schema-discovery", "report scope must match task metadata discovery");
assert(report.readOnly === true && report.schemaOnly === true, "report must be read-only schema-only");
assert(report.rawRowsRead === false, "report must not read raw rows");
assert(report.rawTaskContentPrinted === false, "report must not print raw task content");
assert(report.secretRedactionApplied === true, "report must apply secret redaction");
assert(report.productionReady === false && report.mutationEnabled === false && report.restartEnabled === false && report.deployEnabled === false && report.authEnabled === false, "unsafe flags must remain false");
const reportLeakRe = new RegExp(`\\/home\\/|[A-Za-z]:\\\\Users\\\\|Bear${"er"}\\s+|(?:^|[^A-Za-z])${"sk"}-[A-Za-z0-9_-]{20,}`, "i");
assert(!reportLeakRe.test(JSON.stringify(report)), "report must not contain absolute paths or secret-like values");

for (const localOnlyPath of [
  "apps/dashboard/data/local/openclaw-local-export.json",
  "apps/dashboard/data/local/local-openclaw-connector.json"
]) {
  const tracked = spawnSync("git", ["ls-files", localOnlyPath], { cwd: repoRoot, encoding: "utf8" });
  assert(!(tracked.stdout || "").trim(), `${localOnlyPath} must not be tracked`);
}

console.log("OpenClaw WSL task metadata discovery tests passed.");
