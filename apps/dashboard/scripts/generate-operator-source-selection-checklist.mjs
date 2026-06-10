import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "operator-source-selection-checklist.json");
const sourceLockdownPath = join(dashboardRoot, "src", "lib", "data-trust", "source-lockdown.js");

async function loadSourceLockdown() {
  const source = await readFile(sourceLockdownPath, "utf8");
  const context = { window: {}, URLSearchParams };
  vm.runInNewContext(source, context, { filename: "source-lockdown.js" });
  return context.window.OpenClawSourceLockdown;
}

const lockdown = await loadSourceLockdown();
const policy = lockdown.SOURCE_LOCKDOWN_POLICY;

const checklist = {
  checklistId: `operator-source-selection-checklist-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "operator-source-selection",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  operatorRecommendedSource: policy.operatorRecommendedSource,
  operatorRecommendedData: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
  operatorRecommendedUrl: "http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json",
  operatorChecks: [
    "Open dashboard and confirm the source badge before trusting any agent count.",
    "Use the single-agent local-ingest URL for operator truth candidate review.",
    "Confirm the single-agent view shows exactly 1 agent.",
    "Confirm productionStatus remains no-go-for-production.",
    "Confirm safetyMode read-only, mutationEnabled false, and productionWiring disabled.",
    "Do not treat 8 agents as real inventory."
  ],
  fixtureSourceWarnings: [
    "If source is mock, it is demo fixture data only.",
    "If source is gateway-stub, it is contract fixture data only.",
    "Mock and gateway-stub require explicit selection and demo acknowledgement.",
    "8-agent views are lifecycle / contract fixtures, not operator truth."
  ],
  notAllowed: [
    "Do not connect production Gateway.",
    "Do not connect production API.",
    "Do not enable mutation.",
    "Do not add deploy or CI.",
    "Do not add browser credentials, identity secrets, or request identity headers.",
    "Do not mark production ready."
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw operator source selection checklist generated.");
console.log(`Checklist: ${relative(repoRoot, outputPath)}`);
