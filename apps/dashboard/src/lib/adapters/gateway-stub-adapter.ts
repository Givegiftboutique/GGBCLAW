import type { DashboardDataAdapter } from "./types";
import type { GatewayFixtureSet } from "./gateway-contract-mapper";

export declare const GATEWAY_STUB_FIXTURE_BASE: "./data/gateway-stub";

export declare const FIXTURE_FILES: {
  metrics: "metrics.json";
  agents: "agents.json";
  agentDetail: "agent-detail.json";
  tasks: "tasks.json";
  taskDetail: "task-detail.json";
  reviews: "reviews.json";
  logs: "logs.json";
  backups: "backups.json";
  settings: "settings.json";
  rbac: "rbac.json";
  sourceStatus: "source-status.json";
};

export declare function loadGatewayStubFixtures(baseUrl?: string): Promise<GatewayFixtureSet>;

export declare function createGatewayStubDashboardAdapter(config: {
  requestedSource: string;
  source: "gateway-stub";
  dataUrl: string;
  fallbackSource: "mock";
}): Promise<DashboardDataAdapter>;
