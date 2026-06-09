(function () {
const ROLE_IDS = ["viewer", "operator", "reviewer", "admin", "audit-only"];

const ROLE_DEFINITIONS = {
  viewer: {
    id: "viewer",
    label: "Viewer",
    description: "Can inspect dashboard routes and source status only.",
    permissions: ["dashboard:view", "agents:view", "tasks:view", "reviews:view", "logs:view", "backups:view", "settings:view", "rbac:view", "runbook:view"]
  },
  operator: {
    id: "operator",
    label: "Operator",
    description: "Can inspect operations state and draft backup verification requests.",
    permissions: ["dashboard:view", "agents:view", "tasks:view", "reviews:view", "logs:view", "backups:view", "settings:view", "rbac:view", "runbook:view", "backups:draft_verification", "exports:generate_local_snapshot", "quality:run_local_gate"]
  },
  reviewer: {
    id: "reviewer",
    label: "Reviewer",
    description: "Can inspect review gates and generate review decision drafts.",
    permissions: ["dashboard:view", "agents:view", "tasks:view", "reviews:view", "logs:view", "backups:view", "settings:view", "rbac:view", "runbook:view", "reviews:draft_decision", "quality:run_local_gate"]
  },
  admin: {
    id: "admin",
    label: "Admin",
    description: "Can view local config guardrails and generate local draft artifacts.",
    permissions: ["dashboard:view", "agents:view", "tasks:view", "reviews:view", "logs:view", "backups:view", "settings:view", "rbac:view", "runbook:view", "reviews:draft_decision", "backups:draft_verification", "exports:generate_local_snapshot", "quality:run_local_gate", "admin:view_config"]
  },
  "audit-only": {
    id: "audit-only",
    label: "Audit-only",
    description: "Can inspect evidence and policy state with no draft permissions.",
    permissions: ["dashboard:view", "agents:view", "tasks:view", "reviews:view", "logs:view", "backups:view", "settings:view", "rbac:view", "runbook:view"]
  }
};

window.OpenClawRbacRoles = {
  ROLE_IDS,
  ROLE_DEFINITIONS
};
})();
