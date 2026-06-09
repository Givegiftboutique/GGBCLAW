export type DashboardSource = "mock" | "json" | "artifact";

export interface DashboardSourceConfig {
  requestedSource: string;
  source: DashboardSource;
  dataUrl: string;
  fallbackSource: "mock";
}

export declare function parseDashboardSourceConfig(search: string): DashboardSourceConfig;
