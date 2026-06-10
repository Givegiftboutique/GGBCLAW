(function () {
function summarizeAlerts(alerts) {
  const summary = { total: alerts.length, critical: 0, warning: 0, info: 0 };
  for (const alert of alerts) {
    if (summary[alert.severity] !== undefined) summary[alert.severity] += 1;
  }
  return summary;
}

window.OpenClawObservabilitySummary = {
  summarizeAlerts
};
})();
