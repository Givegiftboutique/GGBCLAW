import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stableHash, toDisplayPath } from "./lib/real-local-data-sanitizer.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outPath = join(dashboardRoot, "data", "generated", "real-local-data-discovery-report.json");
const ignoredDirs = new Set([".git", "node_modules", ".venv", "dist", "build"]);
const allowedExtensions = new Set([".json", ".csv", ".log", ".txt", ".md"]);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith("--")) {
      args[argv[index].slice(2)] = argv[index + 1];
      index += 1;
    }
  }
  return args;
}

function extensionOf(path) {
  const match = path.match(/(\.[^.\\\/]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function isHiddenSecretName(name) {
  return name.startsWith(".env") || /\.(pem|key|p12|pfx)$/i.test(name) || /secret|token|cookie|password|credential/i.test(name);
}

async function inspectFile(filePath, role, sourcesFound, sourcesIgnored, warnings) {
  const info = await stat(filePath);
  const name = filePath.split(/[\\/]/).pop() || "unknown";
  const ext = extensionOf(filePath);
  const displayPath = toDisplayPath(filePath, repoRoot);
  if (isHiddenSecretName(name)) {
    sourcesIgnored.push({ role, displayPath: `[REDACTED_PATH]/${stableHash(filePath)}`, reason: "secret-like or hidden file ignored" });
    return;
  }
  if (!allowedExtensions.has(ext)) {
    sourcesIgnored.push({ role, displayPath, reason: "unsupported extension" });
    return;
  }
  if (info.size > 2 * 1024 * 1024) {
    sourcesIgnored.push({ role, displayPath, reason: "file exceeds 2MB pilot limit" });
    return;
  }
  sourcesFound.push({ role, displayPath, basenameHash: stableHash(name), sizeBytes: info.size, extension: ext });
  if (ext === ".log" || ext === ".txt") warnings.push(`${role} will be summarized before output.`);
}

async function walkRoot(rootPath, sourcesFound, sourcesIgnored, warnings) {
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const child = join(current, entry.name);
      if (entry.isDirectory()) {
        if (ignoredDirs.has(entry.name)) {
          sourcesIgnored.push({ role: "directory", displayPath: toDisplayPath(child, repoRoot), reason: "ignored directory" });
        } else {
          await walk(child);
        }
        continue;
      }
      await inspectFile(child, "auto-discovered", sourcesFound, sourcesIgnored, warnings);
    }
  }
  await walk(rootPath);
}

const args = parseArgs(process.argv.slice(2));
const sourcesFound = [];
const sourcesIgnored = [];
const warnings = [];

const explicit = {
  crawlerCsv: args["crawler-csv"],
  crawlerJson: args["crawler-json"],
  agentLogs: args.logs,
  taskMemory: args.tasks,
  artifactIndex: args.artifacts
};

for (const [role, path] of Object.entries(explicit)) {
  if (!path) continue;
  await inspectFile(resolve(repoRoot, path), role, sourcesFound, sourcesIgnored, warnings);
}

if (args.root) {
  await walkRoot(resolve(repoRoot, args.root), sourcesFound, sourcesIgnored, warnings);
}

if (!sourcesFound.length) {
  const sampleFiles = {
    crawlerJson: "apps/dashboard/data/local-ingest/local-dashboard-ingest.sample.json",
    agentLogs: "apps/dashboard/data/local-ingest/agent-run-log.sample.json",
    taskMemory: "apps/dashboard/data/local-ingest/task-memory-index.sample.json",
    artifactIndex: "apps/dashboard/data/local-ingest/artifact-index.sample.json",
    sourceConfig: "apps/dashboard/data/local-ingest/real-local-data.sources.sample.json"
  };
  for (const [role, path] of Object.entries(sampleFiles)) {
    await inspectFile(resolve(repoRoot, path), role, sourcesFound, sourcesIgnored, warnings);
  }
  warnings.push("No CLI paths provided; safe committed sample files were used for local pilot discovery.");
}

const report = {
  reportId: `real-local-data-discovery-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "local-only",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  absolutePathsRedacted: true,
  sourcesFound,
  sourcesIgnored,
  warnings
};

await mkdir(dirname(outPath), { recursive: true });
await writeFile(resolve(repoRoot, args.out || outPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("OpenClaw real local data discovery completed.");
