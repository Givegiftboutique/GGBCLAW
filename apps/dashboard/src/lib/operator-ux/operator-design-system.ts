export type OperatorConsoleTone = "success" | "warning" | "blocked" | "muted";

export interface OperatorConsoleCard {
  title: string;
  value: string;
  note: string;
  tone?: OperatorConsoleTone;
  action?: string;
}

export interface OperatorDesignSystem {
  toneForStatus(status: string): OperatorConsoleTone;
  getRouteSummary(routeId: string): string;
  buildConsoleCard(card: OperatorConsoleCard): OperatorConsoleCard;
  buildSafetyLocks(): OperatorConsoleCard[];
}

declare global {
  interface Window {
    OpenClawOperatorDesignSystem?: OperatorDesignSystem;
  }
}

export {};
