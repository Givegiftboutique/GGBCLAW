import type { ForbiddenMutationPermission, OpenClawPermission } from "./permissions";
import type { OpenClawRoleDefinition, OpenClawRoleId } from "./roles";

export interface RbacMatrixEntry {
  roleId: OpenClawRoleId;
  label: string;
  description: string;
  permissions: OpenClawPermission[];
  deniedPermissions: OpenClawPermission[];
  forbiddenActions: ForbiddenMutationPermission[];
}

export declare function getRole(roleId: OpenClawRoleId): OpenClawRoleDefinition;
export declare function hasPermission(roleId: OpenClawRoleId, permission: OpenClawPermission): boolean;
export declare function getAllowedPermissions(roleId: OpenClawRoleId): OpenClawPermission[];
export declare function getDeniedPermissions(roleId: OpenClawRoleId): OpenClawPermission[];
export declare function getUnavailableActions(roleId: OpenClawRoleId): string[];
export declare function getRoleMatrix(): RbacMatrixEntry[];
export declare function validateRbacPolicy(): { ok: boolean; issues: string[] };
