export type ProviderId = "qweapi" | "huawei-llm-agent" | "intenext-codex";
export type BalanceStatus = "ok" | "low" | "unknown" | "review-required";

export interface ProviderBalance {
  providerId: ProviderId;
  displayName: string;
  balanceStatus: BalanceStatus;
  balanceText: string;
  lastCheckedAt: string | null;
  consoleUrlLabel: string;
  credentialStoredInRepo: false;
  apiKeyStoredInRepo: false;
  passwordStoredInRepo: false;
  notes: string[];
}
