export type LocalOpenClawConnectionStatus =
  | "connected"
  | "not-connected"
  | "misconfigured"
  | "unsafe-rejected"
  | "not-evaluated";

export type LocalOpenClawReadinessStatus =
  | "ready-readonly-local"
  | "needs-local-config"
  | "needs-openclaw-running"
  | "unsafe-rejected"
  | "review-required";

export interface LocalOpenClawConnectorConfig {
  schemaVersion: "local-openclaw-connector.v1";
  connectorEnabled: boolean;
  connectionMode: "localhost-http-or-local-file";
  baseUrl?: string;
  allowedMethods: ["GET"];
  allowedPaths: Array<"/api/local/export" | "/api/local/agents" | "/api/local/tasks" | "/health" | "/status" | "/agents" | "/tasks">;
  localExportPath?: string;
  safetyMode: "read-only";
  mutationEnabled: false;
  restartEnabled: false;
  deployEnabled: false;
  productionGatewayEnabled: false;
  authEnabled: false;
  credentialRequired: false;
}

export interface LocalOpenClawConnectorSummary {
  connectionStatus: LocalOpenClawConnectionStatus;
  readinessStatus: LocalOpenClawReadinessStatus;
  connected: boolean;
  agentCount: number;
  taskCount: number;
  productionReady: false;
  productionStatus: "no-go-for-production";
  safetyMode: "read-only";
  mutationEnabled: false;
  restartEnabled: false;
  deployEnabled: false;
  productionGatewayEnabled: false;
  authEnabled: false;
  credentialRequired: false;
}
