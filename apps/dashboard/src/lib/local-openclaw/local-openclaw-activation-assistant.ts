export type LocalOpenClawActivationStatus =
  | "needs-local-config"
  | "needs-openclaw-running"
  | "ready-to-test"
  | "connected-readonly"
  | "unsafe-rejected"
  | "review-required";

export interface LocalOpenClawActivationSummary {
  activationStatus: LocalOpenClawActivationStatus;
  localConfigPresent: boolean;
  connectorEnabled: boolean;
  baseUrlSafeLabel: string;
  localExportPath: string;
  allowedMethods: ["GET"];
  externalNetworkAllowed: false;
  productionReady: false;
  productionStatus: "no-go-for-production";
  safetyMode: "read-only";
  mutationEnabled: false;
  restartEnabled: false;
  deployEnabled: false;
  productionGatewayEnabled: false;
  authEnabled: false;
  credentialRequired: false;
  rawConfigPrinted: false;
  secretRedactionApplied: true;
  operatorSteps: string[];
  safeNextSteps: string[];
  blockedActions: string[];
}
