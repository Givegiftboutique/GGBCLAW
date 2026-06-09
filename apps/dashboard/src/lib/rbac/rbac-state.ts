import type { OpenClawPermission } from "./permissions";
import type { OpenClawRoleId } from "./roles";

export interface SimulatedRoleState {
  currentRole: OpenClawRoleId;
  label: string;
  description: string;
  allowedPermissions: OpenClawPermission[];
  deniedPermissions: OpenClawPermission[];
  unavailableActions: string[];
  storage: "memory-only";
  safetyNotes: string[];
}

export declare function getCurrentRole(): OpenClawRoleId;
export declare function setCurrentRole(roleId: OpenClawRoleId): OpenClawRoleId;
export declare function getCurrentRoleState(): SimulatedRoleState;
