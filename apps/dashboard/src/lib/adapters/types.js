(function () {
const DASHBOARD_ADAPTER_VERSION = "phase-02-read-only-v1";

const READ_ONLY_METHODS = [
  "getMetrics",
  "getAgents",
  "getAgentById",
  "getTasks",
  "getTaskById",
  "getReviews",
  "getLogs",
  "getBackups",
  "getSettings",
  "getRbacSummary"
];

const DISABLED_MUTATION_CAPABILITIES = [
  "approve review",
  "reject review",
  "run backup",
  "restore backup",
  "update settings",
  "delete task",
  "cancel task"
];

window.OpenClawAdapterTypes = {
  DASHBOARD_ADAPTER_VERSION,
  READ_ONLY_METHODS,
  DISABLED_MUTATION_CAPABILITIES
};
})();
