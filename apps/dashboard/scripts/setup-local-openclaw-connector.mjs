import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const configRel = "apps/dashboard/data/local/local-openclaw-connector.json";
const defaultExportRel = "apps/dashboard/data/local/openclaw-local-export.json";
const secretHintRe = /(token|key|password|secret|credential|cookie|authorization|bearer|auth)/i;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") args.baseUrl = argv[index += 1];
    else if (arg === "--local-export") args.localExport = argv[index += 1];
  }
  return args;
}

async function loadConnectorModule() {
  const source = await readFile(join(dashboardRoot, "src/lib/local-openclaw/local-openclaw-connector.js"), "utf8");
  const context = { window: {}, URL };
  vm.runInNewContext(source, context, { filename: "local-openclaw-connector.js" });
  return context.window.OpenClawLocalOpenClawConnector;
}

function fail(message) {
  console.error(`OpenClaw local connector setup rejected: ${message}`);
  process.exitCode = 1;
}

const args = parseArgs(process.argv.slice(2));
const connector = await loadConnectorModule();
const hasBaseUrl = Boolean(args.baseUrl);
const hasLocalExport = Boolean(args.localExport);

if (hasBaseUrl === hasLocalExport) {
  fail("provide exactly one of --base-url or --local-export");
} else if (hasBaseUrl && !connector.isSafeLocalUrl(args.baseUrl)) {
  fail("base-url must be http localhost / 127.0.0.1 without token/key/password/auth");
} else if (hasLocalExport && !connector.isSafeLocalExportPath(args.localExport)) {
  fail("local-export must be repo-relative apps/dashboard/data/local/openclaw-local-export*.json");
} else if (hasBaseUrl && secretHintRe.test(String(args.baseUrl))) {
  fail("base-url contains a secret-like marker");
} else if (hasLocalExport && secretHintRe.test(String(args.localExport))) {
  fail("local-export path contains a secret-like marker");
} else {
  const normalizedBaseUrl = hasBaseUrl ? connector.normalizeLocalhostUrl(args.baseUrl) : "http://127.0.0.1:8787";
  const localExportPath = hasLocalExport ? String(args.localExport).replaceAll("\\", "/").replace(/^\.\//, "") : defaultExportRel;
  const config = {
    schemaVersion: "local-openclaw-connector.v1",
    generatedAt: new Date().toISOString(),
    connectorEnabled: true,
    connectionMode: "localhost-http-or-local-file",
    baseUrl: normalizedBaseUrl,
    allowedMethods: ["GET"],
    allowedPaths: ["/api/local/export", "/api/local/agents", "/api/local/tasks", "/health", "/status", "/agents", "/tasks"],
    localExportPath,
    safetyMode: "read-only",
    mutationEnabled: false,
    restartEnabled: false,
    deployEnabled: false,
    productionGatewayEnabled: false,
    authEnabled: false,
    credentialRequired: false,
    setupMode: hasBaseUrl ? "localhost-http" : "local-export-file",
    notes: [
      "Local-only read-only connector config.",
      "No API key, password, token, Authorization header, cookie, or production endpoint is allowed.",
      "This file is ignored by git and must not be committed."
    ]
  };
  const outputPath = join(repoRoot, configRel);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  console.log("OpenClaw local connector config created locally.");
  console.log(`Config: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
  console.log(`Mode: ${hasBaseUrl ? "localhost config created" : "local export config created"}`);
}
