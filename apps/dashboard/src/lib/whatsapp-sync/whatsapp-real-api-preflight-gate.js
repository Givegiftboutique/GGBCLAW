(function () {
  const GATE_SCOPE = "whatsapp-real-api-preflight-gate";
  const REQUIRED_BLOCKERS = [
    "no real secret manager implementation",
    "no approved real provider credentials",
    "no webhook verification implementation",
    "no privacy / deletion production approval",
    "no legal / consent approval",
    "no production data-retention policy implementation",
    "no abuse/spam handling implementation",
    "no operator approval workflow for real inbound events",
    "no incident rollback runbook for real WhatsApp sync"
  ];

  function hasGate(input, key) {
    return input && input[key] === true;
  }

  function buildWhatsAppRealApiBlockers(input = {}) {
    const blockers = [...REQUIRED_BLOCKERS];
    if (!hasGate(input, "safetyDesignAvailable")) blockers.push("missing WhatsApp sync safety design");
    if (!hasGate(input, "mockContractAvailable")) blockers.push("missing WhatsApp mock contract");
    if (!hasGate(input, "fakeProviderAvailable")) blockers.push("missing read-only fake provider sandbox");
    if (!hasGate(input, "localFallbackAvailable")) blockers.push("missing local-only fallback path");
    return [...new Set(blockers)];
  }

  function evaluateWhatsAppRealApiReadiness(input = {}) {
    const documentationGatesExist = [
      "safetyDesignAvailable",
      "mockContractAvailable",
      "fakeProviderAvailable",
      "localFallbackAvailable",
      "secretManagerDesignAvailable"
    ].every((key) => hasGate(input, key));
    return {
      localOnly: true,
      fakeOnly: true,
      preflightOnly: true,
      documentationGatesExist,
      eligibleFor28IPlanning: documentationGatesExist,
      productionReady: false
    };
  }

  function buildWhatsAppRealApiNextSteps(input = {}) {
    const readiness = evaluateWhatsAppRealApiReadiness(input);
    const steps = [
      "Keep Dashboard local-only and fake-only.",
      "Use local import, helper, mock contract, fake runner, and fake provider reports as fallback evidence.",
      "Document real-provider credential approval before any future read-only planning.",
      "Define webhook verification, replay protection, deletion, consent, abuse handling, and rollback gates before any live API work."
    ];
    if (readiness.eligibleFor28IPlanning) {
      steps.push("28I may plan read-only sync or ignored local config design only; it must not enable network, webhook delivery, production, send, or auto-reply.");
    }
    return steps;
  }

  function buildWhatsAppRealApiPreflightGate(input = {}) {
    const blockers = buildWhatsAppRealApiBlockers(input);
    const readiness = evaluateWhatsAppRealApiReadiness(input);
    return {
      scope: GATE_SCOPE,
      preflightOnly: true,
      realApiConnected: false,
      webhookEnabled: false,
      networkCallsMade: false,
      apiClientAdded: false,
      authEnabled: false,
      tokenConfigured: false,
      secretManagerImplemented: false,
      sendMessageEnabled: false,
      autoReplyEnabled: false,
      mutationEnabled: false,
      productionReady: false,
      localFallbackAvailable: hasGate(input, "localFallbackAvailable"),
      fakeProviderAvailable: hasGate(input, "fakeProviderAvailable"),
      mockContractAvailable: hasGate(input, "mockContractAvailable"),
      safetyDesignAvailable: hasGate(input, "safetyDesignAvailable"),
      secretManagerDesignAvailable: hasGate(input, "secretManagerDesignAvailable"),
      eligibleFor28IPlanning: readiness.eligibleFor28IPlanning,
      blockerCount: blockers.length,
      blockers,
      safeNextSteps: buildWhatsAppRealApiNextSteps(input),
      rawSecretPrinted: false,
      rawChatPrinted: false,
      secretRedactionApplied: true
    };
  }

  window.OpenClawWhatsAppRealApiPreflightGate = {
    GATE_SCOPE,
    REQUIRED_BLOCKERS,
    buildWhatsAppRealApiPreflightGate,
    evaluateWhatsAppRealApiReadiness,
    buildWhatsAppRealApiBlockers,
    buildWhatsAppRealApiNextSteps
  };
})();
