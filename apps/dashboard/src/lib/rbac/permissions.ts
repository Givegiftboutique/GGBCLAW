export type OpenClawPermission =
  | "dashboard:view"
  | "agents:view"
  | "tasks:view"
  | "reviews:view"
  | "logs:view"
  | "backups:view"
  | "settings:view"
  | "rbac:view"
  | "runbook:view"
  | "reviews:draft_decision"
  | "backups:draft_verification"
  | "exports:generate_local_snapshot"
  | "quality:run_local_gate"
  | "admin:view_config";

export type ForbiddenMutationPermission =
  | "reviews:approve"
  | "reviews:reject"
  | "backups:restore"
  | "settings:update"
  | "gateway:write"
  | "production:mutate";

export declare const REQUIRED_PERMISSIONS: OpenClawPermission[];
export declare const FORBIDDEN_MUTATION_PERMISSIONS: ForbiddenMutationPermission[];
