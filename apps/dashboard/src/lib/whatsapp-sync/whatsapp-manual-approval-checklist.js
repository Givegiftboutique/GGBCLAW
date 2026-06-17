(function () {
  const CHECKLIST_SCOPE = "whatsapp-manual-approval-checklist";
  const REQUIRED_BLOCKERS = [
    "operator approval missing",
    "privacy policy approval missing",
    "account/data deletion path missing",
    "legal review missing",
    "user consent model missing",
    "abuse/spam handling missing",
    "incident rollback runbook missing",
    "real secret manager not implemented",
    "webhook verification not implemented",
    "real provider credentials not approved",
    "production data retention not approved",
    "send/reply approval missing",
    "auto-reply approval missing"
  ];

  function flag(input, key) {
    return input && input[key] === true;
  }

  function redactWhatsAppManualApprovalInput(input = {}) {
    return {
      checklistSource: input.checklistSource || "committed-docs-only",
      rawSecretPrinted: false,
      rawChatPrinted: false,
      secretRedactionApplied: true
    };
  }

  function buildWhatsAppManualApprovalBlockers(input = {}) {
    const blockers = [...REQUIRED_BLOCKERS];
    if (flag(input, "realApiConnected")) blockers.push("real API connection must remain disabled");
    if (flag(input, "webhookEnabled")) blockers.push("webhook must remain disabled");
    if (flag(input, "networkCallsMade")) blockers.push("network calls must remain disabled");
    if (flag(input, "tokenConfigured")) blockers.push("token configuration must remain disabled");
    if (flag(input, "sendMessageEnabled")) blockers.push("send message must remain disabled");
    if (flag(input, "autoReplyEnabled")) blockers.push("auto-reply must remain disabled");
    if (flag(input, "mutationEnabled")) blockers.push("mutation must remain disabled");
    if (flag(input, "productionReady")) blockers.push("productionReady true is forbidden");
    return [...new Set(blockers)];
  }

  function evaluateWhatsAppGoNoGo(input = {}) {
    const blockers = buildWhatsAppManualApprovalBlockers(input);
    return {
      goNoGoStatus: "no-go",
      goAllowed: false,
      nextPlanningAllowed: flag(input, "documentationAvailable") && blockers.length >= REQUIRED_BLOCKERS.length,
      productionReady: false
    };
  }

  function buildWhatsAppManualApprovalNextSteps() {
    return [
      "Keep WhatsApp local-only, fake-only, and dry-run only.",
      "Complete operator, privacy, deletion, legal, consent, abuse handling, incident rollback, and secret manager approval outside this sprint.",
      "Do not connect a real WhatsApp API, add webhook routes, configure tokens, send/reply, auto-reply, or enable production.",
      "Next phase can only be planning or an RC checkpoint, not production."
    ];
  }

  function buildWhatsAppManualApprovalChecklist(input = {}) {
    const blockers = buildWhatsAppManualApprovalBlockers(input);
    const readiness = evaluateWhatsAppGoNoGo(input);
    return {
      scope: CHECKLIST_SCOPE,
      manualApprovalOnly: true,
      goNoGoStatus: readiness.goNoGoStatus,
      realApiConnected: false,
      webhookEnabled: false,
      networkCallsMade: false,
      tokenConfigured: false,
      sendMessageEnabled: false,
      autoReplyEnabled: false,
      mutationEnabled: false,
      productionReady: false,
      operatorApprovalRequired: true,
      privacyApprovalRequired: true,
      deletionPathRequired: true,
      legalReviewRequired: true,
      consentRequired: true,
      abuseHandlingRequired: true,
      incidentRollbackRequired: true,
      secretManagerRequired: true,
      blockerCount: blockers.length,
      blockers,
      safeNextSteps: buildWhatsAppManualApprovalNextSteps(input),
      rawSecretPrinted: false,
      rawChatPrinted: false,
      secretRedactionApplied: true
    };
  }

  window.OpenClawWhatsAppManualApprovalChecklist = {
    CHECKLIST_SCOPE,
    REQUIRED_BLOCKERS,
    buildWhatsAppManualApprovalChecklist,
    evaluateWhatsAppGoNoGo,
    buildWhatsAppManualApprovalBlockers,
    buildWhatsAppManualApprovalNextSteps,
    redactWhatsAppManualApprovalInput
  };
})();
