import type { DashboardDataAdapter } from "./types";

export interface JsonSourceConfig {
  requestedSource: string;
  source: "json";
  dataUrl: string;
  fallbackSource: "mock";
}

export declare function createJsonDashboardAdapter(config: JsonSourceConfig): Promise<DashboardDataAdapter>;
