import type { OpenClawPermission } from "./permissions";

export type OpenClawRoleId = "viewer" | "operator" | "reviewer" | "admin" | "audit-only";

export interface OpenClawRoleDefinition {
  id: OpenClawRoleId;
  label: string;
  description: string;
  permissions: OpenClawPermission[];
}

export declare const ROLE_IDS: OpenClawRoleId[];
export declare const ROLE_DEFINITIONS: Record<OpenClawRoleId, OpenClawRoleDefinition>;
