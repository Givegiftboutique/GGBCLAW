(function () {
  const CONFIG_SCOPE = "whatsapp-readonly-sandbox-config-gate";
  const SCHEMA_VERSION = "whatsapp-readonly-sandbox-config.v1";
  const SECRET_VALUE_RE = /(?:Bearer\s+|ghp_|xox[baprs]-|sk-[A-Za-z0-9_-]{20,}|password\s*[:=]|token\s*[:=]|cookie\s*[:=]|credential\s*[:=])/i;
  const PHONE_RE = /(?:^|[^A-Za-z0-9])(?:\+\d[\d\s().-]{7,}|\d{8,}|\d{3}[-. ]\d{3}[-. ]\d{4})(?:[^A-Za-z0-9]|$)/;

  function bool(input, key) {
    return input && input[key] === true;
  }

  function redactWhatsAppReadonlySandboxConfig(input = {}) {
    return {
      schemaVersion: input.schemaVersion || SCHEMA_VERSION,
      enabled: bool(input, "enabled"),
      providerMode: typeof input.providerMode === "string" ? input.providerMode : "disabled",
      allowNetworkCalls: bool(input, "allowNetworkCalls"),
      allowWebhook: bool(input, "allowWebhook"),
      allowSendMessage: bool(input, "allowSendMessage"),
      allowAutoReply: bool(input, "allowAutoReply"),
      allowProduction: bool(input, "allowProduction"),
      tokenConfigured: bool(input, "tokenConfigured"),
      secretReferenceConfigured: bool(input, "secretReferenceConfigured"),
      secretReferenceSafeLabel: input.secretReferenceSafeLabel ? "[redacted-safe-label]" : null,
      approvedFixtureModeOnly: input.approvedFixtureModeOnly !== false,
      operatorReviewed: bool(input, "operatorReviewed"),
      productionReady: bool(input, "productionReady")
    };
  }

  function buildWhatsAppReadonlySandboxBlockers(input = {}) {
    const blockers = [];
    const config = input.config || input;
    const source = input.configSource || "missing";
    const rawText = typeof input.rawText === "string" ? input.rawText : "";
    if (!config || source === "missing") blockers.push("config_missing");
    if (source === "example" || bool(config, "enabled") !== true) blockers.push("sandbox_disabled");
    if (bool(config, "enabled") && bool(config, "allowNetworkCalls") !== true) blockers.push("network_not_allowed");
    if (bool(config, "allowNetworkCalls")) blockers.push("network_requires_future_approval");
    if (bool(config, "allowWebhook")) blockers.push("unsafe_webhook_enabled");
    if (bool(config, "allowSendMessage")) blockers.push("unsafe_send_message_enabled");
    if (bool(config, "allowAutoReply")) blockers.push("unsafe_auto_reply_enabled");
    if (bool(config, "allowProduction")) blockers.push("unsafe_production_enabled");
    if (bool(config, "productionReady")) blockers.push("unsafe_production_ready_true");
    if (bool(config, "tokenConfigured")) blockers.push("unsafe_token_configured");
    if (bool(config, "secretReferenceConfigured")) blockers.push("secret_reference_requires_manual_approval");
    if (SECRET_VALUE_RE.test(rawText) || PHONE_RE.test(rawText)) blockers.push("unsafe_secret_or_phone_like_value");
    if (config.schemaVersion && config.schemaVersion !== SCHEMA_VERSION) blockers.push("schema_version_mismatch");
    return [...new Set(blockers)];
  }

  function validateWhatsAppReadonlySandboxConfig(input = {}) {
    const config = input.config || input;
    const source = input.configSource || "missing";
    const blockers = buildWhatsAppReadonlySandboxBlockers({ ...input, config, configSource: source });
    return {
      scope: CONFIG_SCOPE,
      configPresent: source !== "missing",
      configSource: source,
      preflightOnly: true,
      sandboxEligible: false,
      valid: blockers.length === 0,
      enabled: bool(config, "enabled"),
      providerMode: typeof config.providerMode === "string" ? config.providerMode : "disabled",
      networkCallsMade: false,
      allowNetworkCalls: bool(config, "allowNetworkCalls"),
      webhookEnabled: bool(config, "allowWebhook"),
      allowWebhook: bool(config, "allowWebhook"),
      apiClientAdded: false,
      authEnabled: false,
      tokenConfigured: bool(config, "tokenConfigured"),
      secretReferenceConfigured: bool(config, "secretReferenceConfigured"),
      sendMessageEnabled: bool(config, "allowSendMessage"),
      autoReplyEnabled: bool(config, "allowAutoReply"),
      mutationEnabled: false,
      productionReady: false,
      blockerCount: blockers.length,
      blockers,
      redactedConfig: redactWhatsAppReadonlySandboxConfig(config),
      rawSecretPrinted: false,
      rawConfigPrinted: false,
      rawChatPrinted: false,
      secretRedactionApplied: true
    };
  }

  function buildWhatsAppReadonlySandboxConfigSummary(input = {}) {
    const result = validateWhatsAppReadonlySandboxConfig(input);
    return {
      scope: CONFIG_SCOPE,
      configPresent: result.configPresent,
      configSource: result.configSource,
      preflightOnly: true,
      sandboxEligible: false,
      enabled: result.enabled,
      providerMode: result.providerMode,
      networkCallsMade: false,
      allowNetworkCalls: result.allowNetworkCalls,
      webhookEnabled: result.webhookEnabled,
      allowWebhook: result.allowWebhook,
      apiClientAdded: false,
      authEnabled: false,
      tokenConfigured: result.tokenConfigured,
      secretReferenceConfigured: result.secretReferenceConfigured,
      sendMessageEnabled: result.sendMessageEnabled,
      autoReplyEnabled: result.autoReplyEnabled,
      mutationEnabled: false,
      productionReady: false,
      blockerCount: result.blockerCount,
      blockers: result.blockers,
      rawSecretPrinted: false,
      rawConfigPrinted: false,
      rawChatPrinted: false,
      secretRedactionApplied: true,
      safeNextSteps: [
        "Keep the example config disabled and fail-closed.",
        "Use ignored local config only for future manual read-only sandbox dry-run planning.",
        "Do not add network, webhook, token, send/reply, auto-reply, or production behavior."
      ]
    };
  }

  async function loadWhatsAppReadonlySandboxConfig(input = {}) {
    return validateWhatsAppReadonlySandboxConfig(input);
  }

  window.OpenClawWhatsAppReadonlySandboxConfig = {
    CONFIG_SCOPE,
    SCHEMA_VERSION,
    loadWhatsAppReadonlySandboxConfig,
    validateWhatsAppReadonlySandboxConfig,
    buildWhatsAppReadonlySandboxConfigSummary,
    buildWhatsAppReadonlySandboxBlockers,
    redactWhatsAppReadonlySandboxConfig
  };
})();
