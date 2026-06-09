export type DevGatewayHost = "localhost" | "127.0.0.1" | "0.0.0.0" | "dev.local" | "openclaw-dev.local";

export interface DevGatewayConfigResult {
  baseUrl: string;
  normalizedBaseUrl: string;
  devGatewayEnabled: boolean;
  devGatewayReason: string;
  allowedHosts: DevGatewayHost[];
}

export declare function validateDevGatewayBaseUrl(baseUrl: string): { ok: boolean; normalizedBaseUrl: string; reason: string };
export declare function parseDevGatewayConfig(params: URLSearchParams): DevGatewayConfigResult;
