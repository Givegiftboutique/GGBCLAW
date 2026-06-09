import type { LocalIngestPayload } from "./local-ingest-mapper";

export interface LocalIngestValidationResult {
  ok: boolean;
  issues: string[];
  warnings: string[];
}

export declare function validateLocalIngestPayload(payload: LocalIngestPayload): LocalIngestValidationResult;
export declare function validateMappedLocalIngestExport(exportPayload: unknown): { ok: boolean; issues: string[] };
