import type { DashboardDataAdapter } from "./types";

export declare const DEFAULT_LOCAL_INGEST_PATH: "./data/local-ingest/local-dashboard-ingest.sample.json";

export declare function createLocalIngestDashboardAdapter(config: {
  requestedSource: string;
  source: "local-ingest";
  dataUrl: string;
  fallbackSource: "mock";
}): Promise<DashboardDataAdapter>;
