import { coreReportPaths, reportId, writeJsonRel } from "./lib/local-operator-rc-utils.mjs";

const requiredReports = [
  "localOperatorReleaseCandidate",
  "localOperatorFinalChecklist",
  "localOperatorKnownRiskRegister",
  "dashboardStabilizationAudit",
  "dailySummary",
  "productionEntryGate",
  "productionAdapterSimulator",
  "readOnlyAdapterContract",
  "disabledAdapterDraft",
  "localHealth",
  "healthEvidence",
  "reviewedInputDryRun",
  "localOpenClawConnector",
  "localOpenClawActivation",
  "localOpenClawExportBridge"
];

const report = {
  indexId: reportId("local-operator-report-index"),
  generatedAt: new Date().toISOString(),
  scope: "local-operator-report-index",
  language: "zh-Hant",
  productionReady: false,
  productionStatus: "no-go-for-production",
  reports: requiredReports.map((id) => ({
    id,
    path: coreReportPaths[id],
    localOnly: true,
    productionReady: false
  })),
  whatsappLocalTaskHelperReportPath: "apps/dashboard/data/generated/whatsapp-local-task-helper-report.json",
  notAllowed: [
    "production-gateway-connect",
    "mutation",
    "restart-agent",
    "deploy",
    "auth-token-use"
  ]
};

await writeJsonRel(coreReportPaths.localOperatorReportIndex, report);

console.log("OpenClaw local operator report index generated.");
