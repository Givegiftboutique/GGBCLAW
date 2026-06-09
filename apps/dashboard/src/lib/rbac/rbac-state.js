(function () {
let currentRole = "admin";

function getCurrentRole() {
  return currentRole;
}

function setCurrentRole(roleId) {
  const nextRole = window.OpenClawRbacRoles.ROLE_DEFINITIONS[roleId] ? roleId : "viewer";
  currentRole = nextRole;
  return currentRole;
}

function getCurrentRoleState() {
  const role = window.OpenClawRbacPolicy.getRole(currentRole);
  return {
    currentRole,
    label: role.label,
    description: role.description,
    allowedPermissions: window.OpenClawRbacPolicy.getAllowedPermissions(currentRole),
    deniedPermissions: window.OpenClawRbacPolicy.getDeniedPermissions(currentRole),
    unavailableActions: window.OpenClawRbacPolicy.getUnavailableActions(currentRole),
    storage: "memory-only",
    safetyNotes: window.OpenClawRbacPolicy.SAFETY_MARKERS
  };
}

window.OpenClawRbacState = {
  getCurrentRole,
  setCurrentRole,
  getCurrentRoleState
};
})();
