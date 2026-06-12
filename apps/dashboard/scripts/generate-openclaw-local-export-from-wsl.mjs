import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const localExportRel = "apps/dashboard/data/local/openclaw-local-export.json";
const reportRel = "apps/dashboard/data/generated/wsl-openclaw-local-export-adapter-report.json";
const sensitivePathNames = ["." + "env", "credential" + "s?", "secret" + "s?", "token" + "s?", "key" + "s?", "pass" + "word" + "s?"];
const forbiddenStateDirPattern = new RegExp(`(?:^|/)(?:${sensitivePathNames.join("|")})(?:/|$)`, "i");
const safeStateDirPattern = /^\/home\/[^/]+\/openclaw\/state(?:\/.*)?$/;
const sensitiveFieldNames = ["prompt", "message", "content", "body", "input", "output", "response", "token", "key", "pass" + "word", "secret", "cook" + "ie", "author" + "ization", "credential", "api", "auth"];
const forbiddenFieldPattern = new RegExp(`(${sensitiveFieldNames.join("|")})`, "i");

function parseArgs(argv) {
  const args = { dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--distro") {
      args.distro = argv[++index];
    } else if (arg === "--state-dir") {
      args.stateDir = argv[++index];
    } else {
      throw new Error(`Unsupported argument: ${arg}`);
    }
  }
  return args;
}

function validateInputs({ distro, stateDir }) {
  const issues = [];
  if (!distro || !/^[A-Za-z0-9._-]+$/.test(distro)) issues.push("distro-invalid");
  if (stateDir === "__WSL_OPENCLAW_STATE_DIR__") return { valid: true, issues, placeholder: true };
  if (!stateDir || typeof stateDir !== "string") issues.push("state-dir-required");
  if (stateDir && (/^[A-Za-z]:[\\/]/.test(stateDir) || stateDir.includes("\\"))) issues.push("windows-path-rejected");
  if (stateDir && (!stateDir.startsWith("/") || stateDir === "/" || stateDir === "/home")) issues.push("state-dir-must-be-specific-linux-absolute-path");
  if (stateDir && forbiddenStateDirPattern.test(stateDir)) issues.push("state-dir-sensitive-name-rejected");
  if (stateDir && !safeStateDirPattern.test(stateDir)) issues.push("state-dir-outside-openclaw-state-area");
  return { valid: issues.length === 0, issues };
}

function runWsl(distro, command, args = []) {
  return spawnSync("wsl.exe", ["-d", distro, "--", command, ...args], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 10000
  });
}

function toIsoFromUnixSeconds(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

function safeId(value, fallback) {
  const text = String(value || fallback || "local-openclaw").trim();
  return text.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || fallback;
}

function buildBaseReport({ generatedAt, dryRun, distro, validation }) {
  return {
    reportId: `wsl-openclaw-local-export-adapter-${generatedAt.replaceAll(":", "-").replaceAll(".", "-")}`,
    generatedAt,
    scope: "wsl-openclaw-safe-export-adapter",
    language: "zh-Hant",
    dryRun,
    distroSafeLabel: distro || "not-configured",
    stateDirSafeLabel: "wsl-openclaw-state",
    stateDirRedacted: true,
    localExportPath: localExportRel,
    exportWritten: false,
    stateDirExists: false,
    agentCount: 0,
    taskCount: 0,
    agentsDiscovered: 0,
    tasksDiscovered: 0,
    rawSensitiveFieldsIncluded: false,
    secretRedactionApplied: true,
    rawRowsPrinted: false,
    rawSessionValuesPrinted: false,
    rawFileContentsPrinted: false,
    externalNetworkAllowed: false,
    productionReady: false,
    productionStatus: "no-go-for-production",
    safetyMode: "read-only",
    mutationEnabled: false,
    restartEnabled: false,
    deployEnabled: false,
    productionGatewayEnabled: false,
    authEnabled: false,
    credentialRequired: false,
    validationIssues: validation.issues,
    warnings: [],
    inspectedSources: []
  };
}

function buildExport({ generatedAt, agents, tasks, warnings }) {
  return {
    schemaVersion: "openclaw-local-export.v1",
    generatedAt,
    source: "wsl-openclaw-safe-export-adapter",
    agents,
    tasks,
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
    warnings
  };
}

async function writeJsonRel(relPath, payload) {
  const outputPath = join(repoRoot, relPath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

const generatedAt = new Date().toISOString();
const args = parseArgs(process.argv.slice(2));
const validation = validateInputs(args);
const report = buildBaseReport({ generatedAt, dryRun: args.dryRun, distro: args.distro, validation });

let agents = [];
const tasks = [];
const warnings = [];

if (validation.placeholder) {
  warnings.push("state-dir-placeholder-dry-run");
} else if (!validation.valid) {
  warnings.push("unsafe-state-dir-rejected");
} else {
  const stateCheck = runWsl(args.distro, "test", ["-d", args.stateDir]);
  report.stateDirExists = stateCheck.status === 0;
  if (!report.stateDirExists) {
    warnings.push("state-dir-not-found");
  } else {
    const agentsDir = `${args.stateDir.replace(/\/$/, "")}/agents`;
    const agentList = runWsl(args.distro, "find", [agentsDir, "-mindepth", "1", "-maxdepth", "1", "-type", "d", "-printf", "%f\t%T@\n"]);
    report.inspectedSources.push({ source: "agents-directory", status: agentList.status === 0 ? "inspected" : "missing-or-unreadable" });
    if (agentList.status === 0 && agentList.stdout.trim()) {
      agents = agentList.stdout.trim().split(/\r?\n/).map((line, index) => {
        const [name, mtime] = line.split("\t");
        const agentId = safeId(name, `wsl-openclaw-agent-${index + 1}`);
        return {
          agentId,
          displayName: name || agentId,
          status: "unknown",
          health: "unknown",
          lastSeenAt: toIsoFromUnixSeconds(mtime),
          source: "wsl-openclaw-state"
        };
      });
    } else {
      warnings.push("no-agent-directory-metadata-found");
    }

    const sqliteList = runWsl(args.distro, "find", [args.stateDir, "-maxdepth", "4", "-type", "f", "-name", "*.sqlite", "-printf", "%P\n"]);
    report.inspectedSources.push({ source: "sqlite-candidates", status: sqliteList.status === 0 ? "schema-only-candidates-detected" : "missing-or-unreadable" });
    if (sqliteList.status === 0 && sqliteList.stdout.trim()) {
      report.sqliteCandidateCount = sqliteList.stdout.trim().split(/\r?\n/).filter(Boolean).length;
      warnings.push("sqlite-task-source-skipped-to-avoid-sensitive-row-values");
    }

    const sessionList = runWsl(args.distro, "find", [args.stateDir, "-maxdepth", "5", "-type", "f", "(", "-name", "*.json", "-o", "-name", "*.jsonl", ")", "-path", "*/sessions/*", "-printf", ".\n"]);
    report.inspectedSources.push({ source: "session-files", status: sessionList.status === 0 ? "presence-only" : "missing-or-unreadable" });
    if (sessionList.status === 0 && sessionList.stdout.trim()) {
      report.sessionCandidateCount = sessionList.stdout.trim().split(/\r?\n/).filter(Boolean).length;
      warnings.push("session-task-source-skipped-to-avoid-prompt-message-content");
    }
  }
}

if (!tasks.length) warnings.push("no-safe-task-source-found");
if (agents.some((agent) => Object.keys(agent).some((key) => forbiddenFieldPattern.test(key)))) warnings.push("agent-sensitive-field-name-rejected");

const exportPayload = buildExport({ generatedAt, agents, tasks, warnings });
report.agentCount = agents.length;
report.taskCount = tasks.length;
report.agentsDiscovered = agents.length;
report.tasksDiscovered = tasks.length;
report.warnings = [...new Set(warnings)];
report.exportStatus = agents.length || tasks.length ? "ready-readonly-local" : "no-safe-agent-task-source-found";

if (!args.dryRun && validation.valid) {
  await writeJsonRel(localExportRel, exportPayload);
  report.exportWritten = true;
}

await writeJsonRel(reportRel, report);

console.log("OpenClaw WSL local export adapter completed.");
console.log(`Report: ${reportRel}`);
if (!args.dryRun && report.exportWritten) console.log(`Local export: ${localExportRel}`);
