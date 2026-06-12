(function () {
  const REFRESH_INTERVAL_MINUTES = 60;
  const WATCHED_REPORTS = [
    "apps/dashboard/data/generated/local-task-inbox-report.json",
    "apps/dashboard/data/generated/daily-operator-summary-report.json",
    "apps/dashboard/data/generated/local-real-agent-health-report.json",
    "apps/dashboard/data/generated/local-health-evidence-review-report.json",
    "apps/dashboard/data/generated/local-operator-release-candidate-report.json",
    "apps/dashboard/data/generated/provider-balance-center-report.json",
    "apps/dashboard/data/generated/local-openclaw-connector-report.json",
    "apps/dashboard/data/generated/local-openclaw-activation-report.json"
  ];

  function buildRefreshState(now = new Date(), source = "initial-load") {
    const next = new Date(now.getTime() + REFRESH_INTERVAL_MINUTES * 60 * 1000);
    return {
      refreshIntervalMinutes: REFRESH_INTERVAL_MINUTES,
      lastRefreshAt: now.toISOString(),
      nextRefreshAt: next.toISOString(),
      refreshSource: source,
      externalFetchEnabled: false,
      productionFetchEnabled: false,
      localReportsOnly: true,
      watchedReports: WATCHED_REPORTS
    };
  }

  function scheduleHourlyReload(callback, timer = window) {
    return timer.setInterval(callback, REFRESH_INTERVAL_MINUTES * 60 * 1000);
  }

  window.OpenClawHourlyRefreshPolicy = { REFRESH_INTERVAL_MINUTES, WATCHED_REPORTS, buildRefreshState, scheduleHourlyReload };
})();
