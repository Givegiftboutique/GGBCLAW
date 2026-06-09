import type { ActionDraft } from "./action-draft-builder";

export interface ActionDraftValidationResult {
  ok: boolean;
  issues: string[];
}

export declare function validateActionDraft(draft: ActionDraft): ActionDraftValidationResult;
export declare function validateActionDraftList(drafts: ActionDraft[]): ActionDraftValidationResult;
