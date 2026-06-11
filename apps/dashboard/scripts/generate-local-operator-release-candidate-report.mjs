import { buildRcAudit, coreReportPaths, reportId, writeJsonRel } from "./lib/local-operator-rc-utils.mjs";

const { audit } = await buildRcAudit();
const report = {
  reportId: reportId("local-operator-release-candidate"),
  generatedAt: new Date().toISOString(),
  ...audit,
  coreReports: Object.entries(coreReportPaths).map(([id, path]) => ({ id, path })),
  releaseCandidateStatus: audit.releaseCandidateStatus,
  productionReady: false,
  productionStatus: "no-go-for-production"
};

await writeJsonRel(coreReportPaths.localOperatorReleaseCandidate, report);

console.log("OpenClaw local operator release candidate report generated.");
