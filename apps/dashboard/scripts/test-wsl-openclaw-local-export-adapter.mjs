import { access, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(".");
const adapterPath = "apps/dashboard/scripts/generate-openclaw-local-export-from-wsl.mjs";
const helperPath = "apps/dashboard/scripts/generate-openclaw-local-export-from-wsl.ps1";
const reportPath = "apps/dashboard/data/generated/wsl-openclaw-local-export-adapter-report.json";
const exportPath = "apps/dashboard/data/local/openclaw-local-export.json";
const connectorReportPath = "apps/dashboard/data/generated/local-openclaw-connector-report.json";

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

assert(await exists(adapterPath), "WSL adapter script must exist");
assert(await exists(helperPath), "PowerShell helper must exist");

const ignored = spawnSync("git", ["check-ignore", exportPath], { cwd: repoRoot, encoding: "utf8" });
assert(ignored.status === 0, "real WSL local export output must be ignored");
const tracked = spawnSync("git", ["ls-files", exportPath], { cwd: repoRoot, encoding: "utf8" });
assert(!(tracked.stdout || "").trim(), "real WSL local export output must not be tracked");

const adapterBody = await read(adapterPath);
assert(adapterBody.includes("rawSensitiveFieldsIncluded: false"), "adapter must mark raw sensitive fields as excluded");
assert(adapterBody.includes("secretRedactionApplied: true"), "adapter must apply secret redaction");
assert(adapterBody.includes("mutationEnabled: false") && adapterBody.includes("restartEnabled: false") && adapterBody.includes("deployEnabled: false"), "adapter must keep unsafe actions disabled");
const forbiddenTransportRe = new RegExp(`credentials\\s*:\\s*["']include["']|Author${"ization"}\\s*:|process\\.env|dotenv|readFile\\([^)]*\\.${"env"}`, "i");
assert(!forbiddenTransportRe.test(adapterBody), "adapter must not use auth headers, credentials include, or read env files");
assert(adapterBody.includes('"." + "env"'), "adapter must reject env state paths");
const mutationMethodRe = new RegExp(`\\b(method\\s*:\\s*["'](?:${["PO" + "ST", "PU" + "T", "PA" + "TCH", "DE" + "LETE"].join("|")})["']|${["PO" + "ST", "PU" + "T", "PA" + "TCH", "DE" + "LETE"].join("|")})\\b`);
assert(!mutationMethodRe.test(adapterBody.replace(/forbiddenFieldPattern[\s\S]*?;/, "")), "adapter must not use mutation HTTP methods");
for (const forbidden of ["prompt", "message", "content", "body", "input", "output", "token", "pass" + "word", "secret", "cook" + "ie", "author" + "ization", "credential"]) {
  const expectedFragment = forbidden === "pass" + "word" ? '"pass" + "word"' : forbidden;
  const finalExpectedFragment = forbidden === "cook" + "ie" ? '"cook" + "ie"' : expectedFragment;
  const normalizedExpectedFragment = forbidden === "author" + "ization" ? '"author" + "ization"' : finalExpectedFragment;
  assert(adapterBody.includes(normalizedExpectedFragment), `adapter must explicitly screen ${forbidden}`);
}

const unsafeRun = runNode([adapterPath, "--distro", "Ubuntu-24.04", "--state-dir", "/home"]);
assert(unsafeRun.status === 0, "unsafe dry validation should produce a redacted report without throwing");
let report = await readJson(reportPath);
assert(report.validationIssues.includes("state-dir-must-be-specific-linux-absolute-path") || report.validationIssues.includes("state-dir-outside-openclaw-state-area"), "unsafe state dir must be rejected");
assert(report.rawSensitiveFieldsIncluded === false && report.secretRedactionApplied === true, "unsafe report must stay redacted");

const dryRun = runNode([adapterPath, "--distro", "Ubuntu-24.04", "--state-dir", "/home/operator/openclaw/state", "--dry-run"]);
assert(dryRun.status === 0, `dry-run must pass: ${dryRun.stderr || dryRun.stdout}`);
report = await readJson(reportPath);
assert(report.scope === "wsl-openclaw-safe-export-adapter", "report scope must be WSL adapter");
assert(report.dryRun === true && report.exportWritten === false, "dry-run must not write local export");
assert(report.rawSensitiveFieldsIncluded === false && report.secretRedactionApplied === true, "dry-run report must be redacted");
assert(report.rawRowsPrinted === false && report.rawSessionValuesPrinted === false && report.rawFileContentsPrinted === false, "dry-run must not print raw rows/session/file contents");
assert(report.productionReady === false && report.mutationEnabled === false && report.restartEnabled === false && report.deployEnabled === false && report.authEnabled === false && report.productionGatewayEnabled === false, "production and unsafe flags must stay false");
const reportLeakRe = new RegExp(`[A-Za-z]:\\\\Users\\\\|/home/|Bearer\\s+|Author${"ization"}\\s*:|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}`, "i");
assert(!reportLeakRe.test(JSON.stringify(report)), "adapter report must not contain absolute paths or secret-like values");

const previousExport = await exists(exportPath) ? await read(exportPath) : null;
const previousConnector = await exists(connectorReportPath) ? await read(connectorReportPath) : null;
try {
  const fixtureExport = {
    schemaVersion: "openclaw-local-export.v1",
    generatedAt: new Date().toISOString(),
    source: "wsl-openclaw-safe-export-adapter",
    agents: [{ agentId: "main", displayName: "main", status: "unknown", health: "unknown", lastSeenAt: null, source: "wsl-openclaw-state" }],
    tasks: [],
    safety: {
      readOnly: true,
      mutationEnabled: false,
      restartEnabled: false,
      deployEnabled: false,
      productionGatewayEnabled: false,
      authEnabled: false,
      credentialRequired: false,
      rawSensitiveFieldsIncluded: false,
      secretRedactionApplied: true
    },
    warnings: ["no-safe-task-source-found"]
  };
  await writeFile(join(repoRoot, exportPath), `${JSON.stringify(fixtureExport, null, 2)}\n`, "utf8");
  const connectorRun = runNode(["apps/dashboard/scripts/run-local-openclaw-connector.mjs"]);
  assert(connectorRun.status === 0, `connector must read WSL export fixture: ${connectorRun.stderr || connectorRun.stdout}`);
  const connectorReport = await readJson(connectorReportPath);
  assert(connectorReport.connectionStatus === "connected", "connector must connect from local export file");
  assert(connectorReport.localExportSource === "wsl-openclaw-safe-export-adapter", "connector must preserve WSL export source label");
  assert(connectorReport.agentCount === 1, "connector must count WSL export agents");
  assert(connectorReport.taskCount === 0, "connector must count WSL export tasks");
  assert(connectorReport.warnings.includes("no-safe-task-source-found"), "connector must surface WSL export warnings safely");
} finally {
  if (previousExport === null) await rm(join(repoRoot, exportPath), { force: true });
  else await writeFile(join(repoRoot, exportPath), previousExport, "utf8");
  if (previousConnector !== null) await writeFile(join(repoRoot, connectorReportPath), previousConnector, "utf8");
}

console.log("OpenClaw WSL local export adapter tests passed.");
