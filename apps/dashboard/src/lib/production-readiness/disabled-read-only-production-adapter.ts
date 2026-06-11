export interface DisabledReadOnlyAdapterStatus {
  adapterName: "disabled-read-only-production-adapter-draft";
  adapterEnabled: false;
  connected: false;
  productionReady: false;
  productionStatus: "no-go-for-production";
  endpointConfigured: false;
  authEnabled: false;
  simulatorOnly: true;
  safetyMode: "read-only";
  mutationEnabled: false;
  restartEnabled: false;
  productionGatewayEnabled: false;
  deployEnabled: false;
  dataReturned: false;
  reason: "disabled-by-default";
}

export interface DisabledAdapterResponse {
  ok: false;
  data: null;
  dataReturned: false;
  adapterStatus: "disabled" | "blocked";
  reason: "disabled-by-default" | "unsafe-flags-detected";
  unsafeFlags: string[];
  status: DisabledReadOnlyAdapterStatus;
}

export declare function createDisabledReadOnlyProductionAdapter(): {
  name: "disabled-read-only-production-adapter-draft";
  getStatus: typeof getDisabledReadOnlyAdapterStatus;
  readSnapshot: typeof readDisabledAdapterSnapshot;
  buildResponse: typeof buildDisabledAdapterResponse;
  assertDisabled: typeof assertAdapterDisabled;
};
export declare function getDisabledReadOnlyAdapterStatus(): DisabledReadOnlyAdapterStatus;
export declare function readDisabledAdapterSnapshot(): DisabledAdapterResponse;
export declare function buildDisabledAdapterResponse(input?: Record<string, unknown>): DisabledAdapterResponse;
export declare function assertAdapterDisabled(input?: Record<string, unknown>): {
  disabled: boolean;
  unsafeFlags: string[];
  status: DisabledReadOnlyAdapterStatus;
};
