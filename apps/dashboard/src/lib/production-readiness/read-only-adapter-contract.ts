export type ReadOnlyAdapterContractStatus =
  | "draft-only"
  | "review-required"
  | "blocked"
  | "not-evaluated";

export interface ReadOnlyAdapterContract {
  schemaVersion: "read-only-adapter-contract.v1";
  generatedAt: string;
  scope: "read-only-adapter-contract-review";
  adapterName: "disabled-read-only-production-adapter-draft";
  adapterEnabled: false;
  connected: false;
  productionReady: false;
  productionStatus: "no-go-for-production";
  simulatorOnly: true;
  safetyMode: "read-only";
  mutationEnabled: false;
  restartEnabled: false;
  productionGatewayEnabled: false;
  deployEnabled: false;
  authEnabled: false;
  endpointConfigured: false;
  expectedRealAgentCount: 1;
  actualRealAgentCount: number;
  source: "local-ingest-single-agent-snapshot";
  adapterStatus: ReadOnlyAdapterContractStatus;
  contractShape: Record<string, unknown>;
  blockedActions: string[];
  warnings: string[];
  requiredFollowups: string[];
}

export interface ReadOnlyAdapterContractValidation {
  valid: boolean;
  status: ReadOnlyAdapterContractStatus;
  unexpectedFields: string[];
  forbiddenFieldHits: string[];
  unsafeFlags: string[];
  warnings: string[];
}

export declare function buildReadOnlyAdapterContract(input?: Record<string, unknown>): ReadOnlyAdapterContract;
export declare function validateReadOnlyAdapterContractShape(input?: Record<string, unknown>): ReadOnlyAdapterContractValidation;
export declare function buildAdapterContractReview(input?: Record<string, unknown>): ReadOnlyAdapterContract & {
  contractReviewStatus: ReadOnlyAdapterContractStatus;
  validation: ReadOnlyAdapterContractValidation;
};
export declare function buildForbiddenAdapterFieldPolicy(): {
  allowedFields: string[];
  forbiddenFields: string[];
  requiredFalseFlags: string[];
  blockedActions: string[];
};
export declare function buildReadOnlyAdapterContractCards(input?: Record<string, unknown>): Array<{
  id: string;
  label: string;
  value: string;
}>;
