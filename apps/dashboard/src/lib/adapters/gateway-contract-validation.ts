import type { GatewayFixtureSet } from "./gateway-contract-mapper";

export type GatewayValidationResult = {
  ok: boolean;
  issues: string[];
};

export declare const EXPECTED_ENDPOINTS: readonly [
  "/dashboard/metrics",
  "/dashboard/agents",
  "/dashboard/agents/:id",
  "/dashboard/tasks",
  "/dashboard/tasks/:id",
  "/dashboard/reviews",
  "/dashboard/logs",
  "/dashboard/backups",
  "/dashboard/settings",
  "/dashboard/rbac",
  "/dashboard/source-status"
];

export declare function validateGatewayFixtureSet(fixtures: GatewayFixtureSet): GatewayValidationResult;
