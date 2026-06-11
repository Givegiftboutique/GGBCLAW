import { blockedActions, coreReportPaths, knownRisks, reportId, writeJsonRel } from "./lib/local-operator-rc-utils.mjs";

const report = {
  registerId: reportId("local-operator-known-risk-register"),
  generatedAt: new Date().toISOString(),
  scope: "local-operator-known-risks",
  language: "zh-Hant",
  productionReady: false,
  productionStatus: "no-go-for-production",
  knownRisks,
  acceptedLocalOnlyRisks: [
    "Dashboard is a local operator checkpoint, not production readiness.",
    "Manual review may still be required for health or evidence states.",
    "Fixture sources remain available but are clearly not operator truth."
  ],
  blockedProductionRisks: [
    "production gateway connection",
    "production endpoint configuration",
    "auth/token handling",
    "mutation or restart actions",
    "deploy or CI automation",
    "productionReady true"
  ],
  notAllowed: blockedActions,
  reportRefs: coreReportPaths
};

await writeJsonRel(coreReportPaths.localOperatorKnownRiskRegister, report);

console.log("OpenClaw local operator known risk register generated.");
