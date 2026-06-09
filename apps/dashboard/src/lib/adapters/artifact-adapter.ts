import type { DashboardDataAdapter } from "./types";

export interface ArtifactSourceConfig {
  requestedSource: string;
  source: "artifact";
  dataUrl: string;
  fallbackSource: "mock";
}

export declare function createArtifactDashboardAdapter(config: ArtifactSourceConfig): Promise<DashboardDataAdapter>;
