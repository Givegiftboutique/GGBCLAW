import type { DashboardDataAdapter } from "./types";

export declare function createDevGatewayDashboardAdapter(config: {
  requestedSource: string;
  source: "dev-gateway";
  dataUrl: string;
  fallbackSource: "mock";
  devGateway: {
    devGatewayEnabled: boolean;
    devGatewayReason: string;
    normalizedBaseUrl: string;
  };
}): Promise<DashboardDataAdapter>;
