(function () {
const roleDefinitions = window.OpenClawRbacRoles.ROLE_DEFINITIONS;
const roleIds = window.OpenClawRbacRoles.ROLE_IDS;
const requiredPermissions = window.OpenClawRbacPermissions.REQUIRED_PERMISSIONS;
const forbiddenMutationPermissions = window.OpenClawRbacPermissions.FORBIDDEN_MUTATION_PERMISSIONS;

const RBAC_POLICY_VERSION = "rbac-stub-v1";
const SAFETY_MARKERS = [
  "simulated only",
  "no real auth",
  "no token",
  "no cookie",
  "no production permissions",
  "read-only role simulation"
];

function getRole(roleId) {
  return roleDefinitions[roleId] ?? roleDefinitions.viewer;
}

function hasPermission(roleId, permission) {
  return getRole(roleId).permissions.includes(permission);
}

function getAllowedPermissions(roleId) {
  return [...getRole(roleId).permissions];
}

function getDeniedPermissions(roleId) {
  const allowed = new Set(getAllowedPermissions(roleId));
  return requiredPermissions.filter((permission) => !allowed.has(permission));
}

function getUnavailableActions(roleId) {
  return [
    ...getDeniedPermissions(roleId),
    ...forbiddenMutationPermissions
  ];
}

function getRoleMatrix() {
  return roleIds.map((roleId) => ({
    roleId,
    label: getRole(roleId).label,
    description: getRole(roleId).description,
    permissions: getAllowedPermissions(roleId),
    deniedPermissions: getDeniedPermissions(roleId),
    forbiddenActions: forbiddenMutationPermissions
  }));
}

function validateRbacPolicy() {
  const issues = [];
  for (const roleId of roleIds) {
    const role = roleDefinitions[roleId];
    if (!role) issues.push(`missing role ${roleId}`);
    for (const permission of role?.permissions ?? []) {
      if (!requiredPermissions.includes(permission)) issues.push(`${roleId} grants unknown permission ${permission}`);
      if (forbiddenMutationPermissions.includes(permission)) issues.push(`${roleId} grants forbidden mutation permission ${permission}`);
    }
  }
  for (const permission of requiredPermissions) {
    if (!Object.values(roleDefinitions).some((role) => role.permissions.includes(permission))) {
      issues.push(`required permission is not represented in any role: ${permission}`);
    }
  }
  return { ok: issues.length === 0, issues };
}

window.OpenClawRbacPolicy = {
  RBAC_POLICY_VERSION,
  SAFETY_MARKERS,
  getRole,
  hasPermission,
  getAllowedPermissions,
  getDeniedPermissions,
  getUnavailableActions,
  getRoleMatrix,
  validateRbacPolicy
};
})();
