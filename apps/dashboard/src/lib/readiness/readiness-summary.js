(function () {
function summarizeReadiness(checks) {
  const summary = { pass: 0, warning: 0, blocker: 0, notApplicable: 0 };
  for (const check of checks) {
    if (check.status === "not_applicable") summary.notApplicable += 1;
    else if (summary[check.status] !== undefined) summary[check.status] += 1;
  }
  return summary;
}

window.OpenClawReadinessSummary = {
  summarizeReadiness
};
})();
