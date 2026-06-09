export type LocalIngestKind = "dashboardExport" | "crawlerOutput" | "agentRunLog" | "taskMemoryIndex" | "artifactIndex";

export interface LocalIngestMetadata {
  schemaVersion: "local-ingest-v1";
  ingestKind: LocalIngestKind;
  generatedAt: string;
  source: "local-ingest";
  safetyMode: "read-only";
  mutationEnabled: false;
}

export interface LocalIngestPayload {
  metadata: LocalIngestMetadata;
  agents?: unknown[];
  tasks?: unknown[];
  logs?: unknown[];
  artifacts?: unknown[];
  crawlerOutput?: unknown;
  agentRuns?: unknown[];
  taskMemory?: unknown[];
  artifactIndex?: unknown[];
  sourceStatus?: unknown;
}

export declare function mapLocalIngestToDashboardExport(payload: LocalIngestPayload, dataUrl?: string): unknown;
export declare function detectKind(payload: LocalIngestPayload): LocalIngestKind;
