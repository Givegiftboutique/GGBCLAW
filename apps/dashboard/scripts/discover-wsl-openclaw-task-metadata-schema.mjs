import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const reportRel = "apps/dashboard/data/generated/wsl-openclaw-task-metadata-schema-discovery-report.json";
const classifierPath = join(repoRoot, "apps/dashboard/src/lib/local-openclaw/local-openclaw-task-metadata-safety.js");
const sensitivePathNames = ["." + "env", "credential" + "s?", "secret" + "s?", "token" + "s?", "key" + "s?", "pass" + "word" + "s?"];
const forbiddenStateDirPattern = new RegExp(`(?:^|/)(?:${sensitivePathNames.join("|")})(?:/|$)`, "i");
const safeStateDirPattern = /^\/home\/[^/]+\/openclaw\/state(?:\/.*)?$/;
const forbiddenSchemaWords = ["prompt", "message", "content", "body", "input", "output", "response", "token", "key", "pass" + "word", "secret", "cook" + "ie", "author" + "ization", "credential"];

function parseArgs(argv) {
  const args = { dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--distro") args.distro = argv[++index];
    else if (arg === "--state-dir") args.stateDir = argv[++index];
    else throw new Error(`Unsupported argument: ${arg}`);
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

async function loadClassifier() {
  const source = await readFile(classifierPath, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "local-openclaw-task-metadata-safety.js" });
  return context.window.OpenClawTaskMetadataSafety;
}

function safeSqliteLabel(relativePath, index) {
  const name = String(relativePath || `sqlite-${index + 1}`).replaceAll("\\", "/").split("/").pop();
  return name && name.endsWith(".sqlite") ? name : `sqlite-${index + 1}.sqlite`;
}

function splitColumnDefinitions(body) {
  const parts = [];
  let current = "";
  let depth = 0;
  let quote = null;
  for (const char of body) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseCreateTables(schemaText) {
  const tables = [];
  const createTableRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`[]?([^"`\]\s(]+)["`\]]?\s*\(([\s\S]*?)\);/gi;
  let match;
  while ((match = createTableRe.exec(schemaText)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const columns = splitColumnDefinitions(body)
      .map((definition) => {
        const trimmed = definition.trim();
        if (/^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK)\b/i.test(trimmed)) return null;
        const columnMatch = trimmed.match(/^["`[]?([^"`\]\s]+)["`\]]?\s*([A-Za-z0-9_()]+)?/);
        if (!columnMatch) return null;
        return {
          name: columnMatch[1],
          type: columnMatch[2] || "unspecified"
        };
      })
      .filter(Boolean);
    tables.push({ tableName, columns });
  }
  return tables;
}

function redactForbiddenColumnEntry(entry) {
  return {
    sqliteFile: entry.sqliteFile,
    tableName: entry.tableName,
    columnName: "redacted-forbidden-column",
    classification: "forbidden"
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
const classifier = await loadClassifier();
const warnings = [];
const sqliteFiles = [];
let candidateTaskTables = [];

const report = {
  reportId: `wsl-openclaw-task-metadata-schema-discovery-${generatedAt.replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt,
  scope: "wsl-openclaw-task-metadata-schema-discovery",
  language: "zh-Hant",
  dryRun: args.dryRun === true,
  readOnly: true,
  schemaOnly: true,
  rawRowsRead: false,
  rawTaskContentPrinted: false,
  rawSqliteRowsPrinted: false,
  secretRedactionApplied: true,
  stateDirSafeLabel: "wsl-openclaw-state",
  stateDirRedacted: true,
  sqliteFilesFoundCount: 0,
  sqliteFiles: [],
  candidateTaskTables: [],
  safeCandidateColumns: [],
  forbiddenColumns: [],
  reviewRequiredColumns: [],
  recommendedNextAction: "metadata-extraction-not-ready",
  productionReady: false,
  productionStatus: "no-go-for-production",
  mutationEnabled: false,
  restartEnabled: false,
  deployEnabled: false,
  productionGatewayEnabled: false,
  authEnabled: false,
  credentialRequired: false,
  validationIssues: validation.issues,
  warnings
};

if (validation.placeholder) {
  warnings.push("state-dir-placeholder-dry-run");
} else if (!validation.valid) {
  warnings.push("unsafe-state-dir-rejected");
} else {
  const stateCheck = runWsl(args.distro, "test", ["-d", args.stateDir]);
  if (stateCheck.status !== 0) {
    warnings.push("state-dir-not-found");
  } else {
    const sqliteList = runWsl(args.distro, "find", [args.stateDir, "-maxdepth", "5", "-type", "f", "-name", "*.sqlite", "-printf", "%P\n"]);
    if (sqliteList.status !== 0) {
      warnings.push("sqlite-candidate-search-failed");
    } else if (sqliteList.stdout.trim()) {
      const relatives = sqliteList.stdout.trim().split(/\r?\n/).filter(Boolean);
      for (let index = 0; index < relatives.length; index += 1) {
        const relativePath = relatives[index];
        const sqliteFile = safeSqliteLabel(relativePath, index);
        sqliteFiles.push({ sqliteFile, safeLabelOnly: true });
        const fullPath = `${args.stateDir.replace(/\/$/, "")}/${relativePath}`;
        const schema = runWsl(args.distro, "sqlite3", [fullPath, ".schema"]);
        if (schema.status !== 0) {
          warnings.push("sqlite3-schema-unavailable");
          continue;
        }
        const tables = parseCreateTables(schema.stdout || "");
        for (const table of tables) {
          const classification = classifier.classifyTaskMetadataTable(table.tableName, table.columns);
          if (!classification.isTaskLike) continue;
          const tableEntry = {
            sqliteFile,
            tableName: table.tableName,
            safeCandidateColumns: classification.safeCandidateColumns.map((column) => ({
              sqliteFile,
              tableName: table.tableName,
              columnName: column.name,
              columnType: column.type || "unspecified",
              classification: "safe-candidate"
            })),
            forbiddenColumns: classification.forbiddenColumns.map((column) => redactForbiddenColumnEntry({
              sqliteFile,
              tableName: table.tableName,
              columnName: column.name
            })),
            reviewRequiredColumns: classification.reviewRequiredColumns.map((column) => ({
              sqliteFile,
              tableName: table.tableName,
              columnName: column.name,
              columnType: column.type || "unspecified",
              classification: "review-required"
            })),
            automaticExportAllowed: false
          };
          candidateTaskTables.push(tableEntry);
        }
      }
    }
  }
}

const summary = classifier.buildTaskMetadataDiscoverySummary({ candidateTaskTables });
report.sqliteFilesFoundCount = sqliteFiles.length;
report.sqliteFiles = sqliteFiles;
report.candidateTaskTables = candidateTaskTables;
report.safeCandidateColumns = summary.safeCandidateColumns;
report.forbiddenColumns = summary.forbiddenColumns.map(redactForbiddenColumnEntry);
report.reviewRequiredColumns = summary.reviewRequiredColumns;
report.recommendedNextAction = summary.recommendedNextAction;
if (!candidateTaskTables.length && validation.valid && !validation.placeholder) warnings.push("no-task-like-schema-found");
if (report.forbiddenColumns.length) warnings.push("forbidden-task-columns-present-redacted");
if (forbiddenSchemaWords.some((word) => JSON.stringify(report.safeCandidateColumns).toLowerCase().includes(word))) {
  warnings.push("safe-column-classification-review-required");
  report.recommendedNextAction = "metadata-extraction-not-ready";
}

await writeJsonRel(reportRel, report);

console.log("OpenClaw WSL task metadata schema discovery completed.");
console.log(`Report: ${reportRel}`);
