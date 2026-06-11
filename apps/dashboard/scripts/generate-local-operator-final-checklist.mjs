import { buildRcAudit, blockedActions, corePanels, coreReportPaths, recommendedOperatorUrl, reportId, writeJsonRel } from "./lib/local-operator-rc-utils.mjs";

const { audit } = await buildRcAudit();
const report = {
  checklistId: reportId("local-operator-final-checklist"),
  generatedAt: new Date().toISOString(),
  scope: "local-operator-final-checklist",
  language: "zh-Hant",
  releaseCandidateStatus: audit.releaseCandidateStatus,
  dailyUseAvailable: audit.dailyUseAvailable,
  productionReady: false,
  productionStatus: "no-go-for-production",
  recommendedOperatorUrl,
  expectedRealAgentCount: 1,
  actualRealAgentCount: audit.actualRealAgentCount,
  operatorChecks: [
    "Use start-operator-dashboard.ps1 to open Dashboard.",
    "Confirm Operator Home is visible.",
    "Confirm Daily Runbook is visible.",
    "Confirm Local Health panel is visible.",
    "Confirm Evidence panel is visible.",
    "Confirm Reviewed Health Input Assistant is visible.",
    "Confirm Production Entry Gate is visible.",
    "Confirm Production Adapter Simulator is visible.",
    "Confirm Read-only Adapter Contract Review is visible.",
    "Confirm Disabled Adapter Draft is visible.",
    "Confirm Stabilization Audit is visible.",
    "Confirm source = local-ingest single-agent.",
    "Confirm agent count = 1.",
    "If 8 agents appear, treat it as fixture/demo data."
  ],
  corePanels,
  notAllowed: [
    ...blockedActions,
    "production-ready-claim",
    "production-endpoint",
    "auth-token-secrets",
    "commit-reviewed-local-agent-health-json"
  ],
  reportRefs: coreReportPaths,
  finalChecklistNotes: [
    "productionReady must remain false.",
    "production no-go is expected.",
    "Future real production work requires separate approval."
  ]
};

await writeJsonRel(coreReportPaths.localOperatorFinalChecklist, report);

console.log("OpenClaw local operator final checklist generated.");
