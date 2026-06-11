(function () {
  const PROVIDERS = [
    { providerId: "qweapi", displayName: "QWE API", consoleUrlLabel: "QWE API 充值/餘額頁" },
    { providerId: "huawei-llm-agent", displayName: "Huawei LLM Agent", consoleUrlLabel: "Huawei LLM Agent 查詢頁" },
    { providerId: "intenext-codex", displayName: "Intenext Codex", consoleUrlLabel: "Intenext Wallet" }
  ];

  function sanitizeProvider(provider) {
    const base = PROVIDERS.find((item) => item.providerId === provider?.providerId) || {};
    return {
      providerId: base.providerId || String(provider?.providerId || "unknown"),
      displayName: base.displayName || String(provider?.displayName || "Unknown Provider"),
      balanceStatus: ["ok", "low", "unknown", "review-required"].includes(provider?.balanceStatus) ? provider.balanceStatus : "unknown",
      balanceText: String(provider?.balanceText || "請在本機填寫餘額"),
      lastCheckedAt: provider?.lastCheckedAt || null,
      consoleUrlLabel: base.consoleUrlLabel || String(provider?.consoleUrlLabel || "本機手動查詢"),
      credentialStoredInRepo: false,
      apiKeyStoredInRepo: false,
      passwordStoredInRepo: false,
      notes: Array.isArray(provider?.notes) ? provider.notes.map(String) : ["只支援本地手動填寫，不會儲存密碼。"]
    };
  }

  function summarizeProviderBalanceCenter(input) {
    const providers = PROVIDERS.map((provider) => {
      const found = Array.isArray(input?.providers) ? input.providers.find((item) => item.providerId === provider.providerId) : null;
      return sanitizeProvider(found || provider);
    });
    return {
      balanceCenterStatus: input ? "loaded" : "missing",
      redactionApplied: true,
      rawSecretsPrinted: false,
      externalLoginEnabled: false,
      productionFetchEnabled: false,
      providers
    };
  }

  window.OpenClawProviderBalanceCenter = { PROVIDERS, sanitizeProvider, summarizeProviderBalanceCenter };
})();
