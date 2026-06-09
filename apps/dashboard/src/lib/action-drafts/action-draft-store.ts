import type { ActionDraft } from "./action-draft-builder";

export interface StoredActionDraft {
  draft: ActionDraft;
  validation: "passed" | "failed";
  issues: string[];
}

export declare function setLatestDraft(draft: ActionDraft): StoredActionDraft;
export declare function getLatestDraft(): StoredActionDraft | null;
export declare function clearLatestDraft(): void;
