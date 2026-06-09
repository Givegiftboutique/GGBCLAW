export type GatewayFixtureEnvelope<T> = {
  meta: {
    contractVersion: "gateway-read-only-v1";
    fixtureVersion: string;
    generatedAt: string;
    source: "gateway-stub";
    safetyMode: "read-only";
    mutationEnabled: false;
    productionWiring: "disabled";
    endpoint: string;
  };
  data: T;
  links: { self: string };
  errors: string[];
};

export type GatewayFixtureSet = {
  metrics: GatewayFixtureEnvelope<{ metrics: unknown[] }>;
  agents: GatewayFixtureEnvelope<{ agents: unknown[] }>;
  agentDetail: GatewayFixtureEnvelope<{ agent: unknown }>;
  tasks: GatewayFixtureEnvelope<{ tasks: unknown[] }>;
  taskDetail: GatewayFixtureEnvelope<{ task: unknown }>;
  reviews: GatewayFixtureEnvelope<{ reviews: unknown[] }>;
  logs: GatewayFixtureEnvelope<{ auditEvents: unknown[] }>;
  backups: GatewayFixtureEnvelope<{ backups: unknown[] }>;
  settings: GatewayFixtureEnvelope<{ settings: unknown }>;
  rbac: GatewayFixtureEnvelope<{ rbac: unknown[] }>;
  sourceStatus: GatewayFixtureEnvelope<{ sourceStatus: unknown }>;
};

export type GatewayDashboardExport = {
  metadata: {
    schemaVersion: "gateway-read-only-v1";
    generatedAt: string;
    source: "gateway-stub";
    safetyMode: "read-only";
    mutationEnabled: false;
    productionWiring: "disabled";
  };
  metrics: unknown[];
  agents: unknown[];
  tasks: unknown[];
  reviews: unknown[];
  auditEvents: unknown[];
  backups: unknown[];
  settings: unknown;
  rbac: unknown[];
  sourceStatus: unknown;
};
