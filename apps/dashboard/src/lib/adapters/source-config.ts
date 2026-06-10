export type DashboardSource = "mock" | "json" | "artifact" | "gateway-stub" | "local-ingest" | "dev-gateway";

export interface DashboardSourceConfig {
  requestedSource: string;
  source: DashboardSource;
  dataUrl: string;
  fallbackSource: "mock";
  devGateway?: {
    baseUrl: string;
    normalizedBaseUrl: string;
    devGatewayEnabled: boolean;
    devGatewayReason: string;
    allowedHosts: string[];
  };
}

export declare function parseDashboardSourceConfig(search: string): DashboardSourceConfig;
