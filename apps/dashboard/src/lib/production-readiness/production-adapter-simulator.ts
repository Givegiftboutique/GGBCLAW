export type ProductionAdapterSimulatorStatus = "disabled" | "not-configured" | "simulator-only" | "blocked";

export interface ProductionAdapterSimulatorPolicy {
  adapterName: "read-only-production-adapter-simulator";
  adapterEnabled: false;
  connected: false;
  productionReady: false;
  productionStatus: "no-go-for-production";
  productionGatewayEnabled: false;
  mutationEnabled: false;
  restartEnabled: false;
  deployEnabled: false;
  authEnabled: false;
  endpointConfigured: false;
  simulatorOnly: true;
  safetyMode: "read-only";
  expectedRealAgentCount: 1;
  actualRealAgentCount: number;
  productionSource: "disabled";
  adapterStatus: ProductionAdapterSimulatorStatus;
  adapterBlockers: string[];
  blockedActions: string[];
}

export interface ProductionAdapterContractShape {
  adapterName: "read-only-production-adapter-simulator";
  mode: "disabled-read-only-simulator";
  enabled: false;
  connected: false;
  endpointConfigured: false;
  authConfigured: false;
  credentialMode: "none";
  allowedMethods: ["GET"];
  mutationMethods: [];
  dataSource: string;
  expectedRealAgentCount: 1;
  actualRealAgentCount: number;
  productionSource: "disabled";
  notes: string[];
}

export declare function buildProductionAdapterSimulatorPolicy(input?: Record<string, unknown>): ProductionAdapterSimulatorPolicy;
export declare function buildProductionAdapterContractShape(input?: Record<string, unknown>): ProductionAdapterContractShape;
export declare function classifyProductionAdapterSimulatorStatus(input?: Record<string, unknown>): ProductionAdapterSimulatorStatus;
export declare function buildProductionAdapterSimulatorBlockers(input?: Record<string, unknown>): string[];
export declare function buildProductionAdapterSimulatorCards(input?: Record<string, unknown>): Array<{ id: string; label: string; value: string }>;
