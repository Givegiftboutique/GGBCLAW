export type ActionDraftType = "review_decision_draft" | "backup_verification_draft" | "settings_change_request_draft" | "export_snapshot_draft";
export type ActionDraftIntent = "approve" | "reject" | "needs_changes" | "verify_backup" | "request_settings_change" | "export_snapshot";

export declare const ACTION_DRAFT_TYPES: ActionDraftType[];
export declare const ACTION_DRAFT_INTENTS: ActionDraftIntent[];
export declare const INTENT_PERMISSION_MAP: Record<ActionDraftIntent, string>;
