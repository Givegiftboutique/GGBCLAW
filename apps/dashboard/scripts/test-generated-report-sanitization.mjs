import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const failures = [];

const targets = [
  "apps/dashboard/data/generated",
  "apps/dashboard/data/local-ingest",
  "apps/dashboard/data/gateway-stub"
];

const redactionMarkers = [
  "redacted",
  "read-only",
  "mutationEnabled",
  "productionWiring",
  "no-go-for-production",
  "\"result\": \"pass\"",
  "\"auditStatus\": \"pass\"",
  "\"auditStatus\": \"warning\""
];

async function collectJson(relativePath) {
  const root = join(repoRoot, relativePath);
  const files = [];
  async function walk(path) {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) await walk(child);
      else if (extname(entry.name).toLowerCase() === ".json") files.push(child);
    }
  }
  try {
    const info = await stat(root);
    if (info.isDirectory()) await walk(root);
    else if (info.isFile()) files.push(root);
  } catch {
    failures.push(`${relativePath} missing`);
  }
  return files;
}

function relativePath(path) {
  return path.replace(repoRoot, "").replace(/^[/\\]/, "").replaceAll("\\", "/");
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

const files = [];
for (const target of targets) files.push(...await collectJson(target));

for (const file of files) {
  const rel = relativePath(file);
  const body = await readFile(file, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (error) {
    failures.push(`${rel} must parse as JSON: ${error.message}`);
    continue;
  }
  const compact = body.replace(/\s+/g, "");

  check(!/[A-Za-z]:\\Users\\|\/home\/[^"'\s]+/i.test(body), `${rel} must not contain absolute machine paths.`);
  check(!/(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i.test(body), `${rel} must not contain secret-like assignments.`);
  check(!/Authorization\s*:/i.test(body), `${rel} must not contain Authorization headers.`);
  check(!/credentials\s*:\s*["']include["']/i.test(body), `${rel} must not contain credentials include.`);
  check(!/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b|production\.example\.com\b|api\.example\.com\b|live\.example\.com\b|example\.com\b)/i.test(body), `${rel} must not contain production-like URLs.`);
  check(!/"mutationEnabled":true/i.test(compact), `${rel} must not enable mutation.`);
  check(!/"productionDeploy":true/i.test(compact), `${rel} must not enable production deploy.`);

  if (rel.startsWith("apps/dashboard/data/generated/")) {
    check(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(body), `${rel} must not contain email-like private data.`);
    check(!/\b(?:phone|tel|mobile|whatsapp|contact)\b.{0,24}(?:\+?\d[\s().-]?){8,}/i.test(body), `${rel} must not contain unredacted phone-like data.`);
    check(body.length < 1_500_000, `${rel} must not contain a raw oversized log dump.`);
    check(redactionMarkers.some((marker) => body.includes(marker)), `${rel} should include a safety or redaction marker.`);
  }

  if (rel.endsWith("operator-evidence-manifest.json")) {
    check(Array.isArray(parsed.evidence), "operator evidence manifest must expose evidence refs.");
    for (const item of parsed.evidence ?? []) {
      check(typeof item.path === "string" && !/^[A-Za-z]:\\|^\//.test(item.path), `evidence ref must be relative: ${item.path}`);
    }
  }
}

if (failures.length) {
  console.error("OpenClaw generated report sanitization tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw generated report sanitization tests passed.");
