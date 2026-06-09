import type { DashboardDataAdapter } from "./types";

export declare function registerDashboardDataAdapter(name: string, adapter: DashboardDataAdapter): void;
export declare function getDashboardDataAdapter(name?: "mock"): DashboardDataAdapter;
export declare function resolveDashboardDataAdapter(config: unknown): Promise<DashboardDataAdapter>;
export declare function listDashboardDataAdapters(): string[];
