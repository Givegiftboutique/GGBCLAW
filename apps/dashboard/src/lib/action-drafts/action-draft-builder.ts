import type { ActionDraftIntent, ActionDraftType } from "./action-draft-types";
import type { OpenClawRoleId } from "../rbac/roles";

export interface ActionDraft {
  draftId: string;
  draftType: ActionDraftType;
  createdAt: string;
  createdByRole: OpenClawRoleId;
  taskId?: string;
  reviewId?: string;
  intent: ActionDraftIntent;
  dryRun: true;
  mutationEnabled: false;
  productionWiring: "disabled";
  requiresHumanApproval: true;
  notSubmitted: true;
  payload: Record<string, unknown>;
  riskNotes: string[];
  auditNotes: string[];
}

export declare function buildReviewDecisionDraft(review: unknown, intent: "approve" | "reject" | "needs_changes", role: OpenClawRoleId): ActionDraft;
export declare function buildBackupVerificationDraft(backup: unknown, role: OpenClawRoleId): ActionDraft;
export declare function buildSettingsChangeRequestDraft(settings: unknown, role: OpenClawRoleId): ActionDraft;
export declare function buildExportSnapshotDraft(role: OpenClawRoleId): ActionDraft;
