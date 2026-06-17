(function () {
  const DRY_RUN_SCOPE = "whatsapp-readonly-sandbox-dry-run";

  function getConfigApi() {
    return window.OpenClawWhatsAppReadonlySandboxConfig;
  }

  function redactWhatsAppReadonlySandboxDryRun(input = {}) {
    const api = getConfigApi();
    const config = input.config || {};
    const redactedConfig = api?.redactWhatsAppReadonlySandboxConfig
      ? api.redactWhatsAppReadonlySandboxConfig(config)
      : {};
    return {
      configSource: input.configSource || "missing",
      redactedConfig,
      rawSecretPrinted: false,
      rawConfigPrinted: false,
      rawChatPrinted: false,
      secretRedactionApplied: true
    };
  }

  function buildWhatsAppReadonlySandboxDryRunBlockers(input = {}) {
    const api = getConfigApi();
    const validatorBlockers = api?.buildWhatsAppReadonlySandboxBlockers
      ? api.buildWhatsAppReadonlySandboxBlockers(input)
      : ["config_validator_missing"];
    const blockers = [...validatorBlockers];
    if (input.futureExplicitApproval !== true) blockers.push("future_explicit_approval_missing");
    if (input.secretManagerImplemented === true) blockers.push("secret_manager_must_not_be_implemented_in_28j");
    return [...new Set(blockers)];
  }

  function buildWhatsAppReadonlySandboxDryRunSummary(input = {}) {
    const api = getConfigApi();
    const validation = api?.validateWhatsAppReadonlySandboxConfig
      ? api.validateWhatsAppReadonlySandboxConfig(input)
      : {
          configPresent: false,
          configSource: "missing",
          enabled: false,
          allowNetworkCalls: false,
          webhookEnabled: false,
          allowWebhook: false,
          tokenConfigured: false,
          sendMessageEnabled: false,
          autoReplyEnabled: false,
          blockers: ["config_validator_missing"]
        };
    const blockers = buildWhatsAppReadonlySandboxDryRunBlockers(input);
    return {
      scope: DRY_RUN_SCOPE,
      dryRunOnly: true,
      configPresent: validation.configPresent === true,
      configSource: validation.configSource || input.configSource || "missing",
      sandboxEligible: false,
      realApiConnected: false,
      networkCallsMade: false,
      allowNetworkCalls: validation.allowNetworkCalls === true,
      webhookEnabled: validation.webhookEnabled === true,
      allowWebhook: validation.allowWebhook === true,
      apiClientAdded: false,
      authEnabled: false,
      tokenConfigured: validation.tokenConfigured === true,
      secretManagerImplemented: false,
      sendMessageEnabled: validation.sendMessageEnabled === true,
      autoReplyEnabled: validation.autoReplyEnabled === true,
      mutationEnabled: false,
      productionReady: false,
      blockerCount: blockers.length,
      blockers,
      rawSecretPrinted: false,
      rawConfigPrinted: false,
      rawChatPrinted: false,
      secretRedactionApplied: true,
      safeNextSteps: [
        "Keep the sandbox dry-run fail-closed.",
        "Keep network, webhook, token, send/reply, auto-reply, and production disabled.",
        "Next phase can only be a manual approval checklist or RC5 checkpoint, not production."
      ]
    };
  }

  function runWhatsAppReadonlySandboxDryRun(input = {}) {
    return {
      ...buildWhatsAppReadonlySandboxDryRunSummary(input),
      redaction: redactWhatsAppReadonlySandboxDryRun(input)
    };
  }

  window.OpenClawWhatsAppReadonlySandboxDryRun = {
    DRY_RUN_SCOPE,
    runWhatsAppReadonlySandboxDryRun,
    buildWhatsAppReadonlySandboxDryRunSummary,
    buildWhatsAppReadonlySandboxDryRunBlockers,
    redactWhatsAppReadonlySandboxDryRun
  };
})();
