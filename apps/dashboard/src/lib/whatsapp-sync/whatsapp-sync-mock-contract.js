(function () {
  const SCHEMA_VERSION = "whatsapp-sync-mock-event.v1";
  const EVENT_TYPES = ["message.created", "message.updated", "message.deleted", "message.reaction", "conversation.updated"];
  const SAFE_PRIORITIES = ["low", "normal", "high", "urgent"];
  const SAFE_STATUSES = ["review_pending", "todo", "in-progress", "done", "failed", "cancelled"];
  const SENSITIVE_RE = /\b(api\s*key|password|token|cookie|authorization|credential|secret)\b/i;
  const PHONE_RE = /(?:\+?\d[\s().-]?){8,}/;
  const URL_WITH_SECRET_RE = /https?:\/\/\S*[?&](?:token|key|password|auth|credential)=/i;
  const RAW_CHAT_RE = /\b(chat export|message history|forwarded many times|end-to-end encrypted|media omitted)\b/i;

  function redactWhatsAppMockText(input) {
    return String(input ?? "")
      .replace(SENSITIVE_RE, "[redacted-sensitive-word]")
      .replace(PHONE_RE, "[redacted-phone]")
      .replace(URL_WITH_SECRET_RE, "[redacted-url]")
      .replace(RAW_CHAT_RE, "[redacted-raw-chat-marker]")
      .trim();
  }

  function hasUnsafeText(input) {
    const text = String(input ?? "");
    return SENSITIVE_RE.test(text) || PHONE_RE.test(text) || URL_WITH_SECRET_RE.test(text);
  }

  function normalizeWhatsAppMockEvent(input) {
    const event = input && typeof input === "object" ? input : {};
    const taskCandidate = event.taskCandidate && typeof event.taskCandidate === "object" ? event.taskCandidate : {};
    return {
      schemaVersion: event.schemaVersion || SCHEMA_VERSION,
      eventId: redactWhatsAppMockText(event.eventId || "mock_evt_unknown"),
      eventType: event.eventType || "message.created",
      source: "offline-whatsapp-contract-mock",
      receivedAt: event.receivedAt || new Date(0).toISOString(),
      sender: {
        safeLabel: redactWhatsAppMockText(event.sender?.safeLabel || "customer_mock_unknown"),
        phoneNumberIncluded: event.sender?.phoneNumberIncluded === true
      },
      message: {
        messageId: redactWhatsAppMockText(event.message?.messageId || "mock_msg_unknown"),
        textSummary: redactWhatsAppMockText(event.message?.textSummary || ""),
        rawTextIncluded: event.message?.rawTextIncluded === true,
        mediaIncluded: event.message?.mediaIncluded === true
      },
      taskCandidate: {
        title: redactWhatsAppMockText(taskCandidate.title || "Review WhatsApp mock event"),
        summary: redactWhatsAppMockText(taskCandidate.summary || event.message?.textSummary || "Review sanitized mock event."),
        priority: SAFE_PRIORITIES.includes(taskCandidate.priority) ? taskCandidate.priority : "normal",
        status: SAFE_STATUSES.includes(taskCandidate.status) ? taskCandidate.status : "review_pending",
        nextStep: redactWhatsAppMockText(taskCandidate.nextStep || "Review before creating a local task.")
      },
      safety: {
        localOnly: true,
        mockOnly: true,
        containsRawChat: event.safety?.containsRawChat === true || event.message?.rawTextIncluded === true,
        containsPhoneNumbers: event.safety?.containsPhoneNumbers === true || event.sender?.phoneNumberIncluded === true,
        containsCredentials: event.safety?.containsCredentials === true,
        operatorReviewRequired: event.safety?.operatorReviewRequired !== false,
        secretRedactionApplied: true
      }
    };
  }

  function validateWhatsAppMockEvent(input) {
    const event = normalizeWhatsAppMockEvent(input);
    const warnings = [];
    const unsafeReasons = [];

    if (event.schemaVersion !== SCHEMA_VERSION) warnings.push("schema-version-mismatch");
    if (!EVENT_TYPES.includes(event.eventType)) unsafeReasons.push("event-type-not-allowed");
    if (event.eventType !== "message.created" && input?.taskCandidate) warnings.push("non-message-created-task-candidate-ignored");
    if (event.message.rawTextIncluded || event.safety.containsRawChat) warnings.push("raw-chat-review-required");
    if (event.sender.phoneNumberIncluded || event.safety.containsPhoneNumbers) warnings.push("phone-number-review-required");
    if (event.message.mediaIncluded) warnings.push("media-review-required");

    const textFields = [
      event.eventId,
      event.sender.safeLabel,
      event.message.messageId,
      event.message.textSummary,
      event.taskCandidate.title,
      event.taskCandidate.summary,
      event.taskCandidate.nextStep
    ];
    if (textFields.some(hasUnsafeText) || event.safety.containsCredentials) unsafeReasons.push("credential-or-secret-like-text");

    const contractStatus = unsafeReasons.length
      ? "unsafe-rejected"
      : warnings.length
        ? "review-required"
        : event.eventType === "message.created"
          ? "safe-candidate"
          : "ignored-non-task-event";

    return {
      ...event,
      contractStatus,
      warnings,
      unsafeReasons,
      rawChatPrinted: false,
      secretRedactionApplied: true,
      networkCallsMade: false,
      webhookRouteAdded: false,
      apiClientAdded: false,
      authEnabled: false,
      productionReady: false
    };
  }

  function mapWhatsAppMockEventToTaskCandidate(input) {
    const validation = validateWhatsAppMockEvent(input);
    if (validation.contractStatus !== "safe-candidate" && validation.contractStatus !== "review-required") return null;
    if (validation.eventType !== "message.created") return null;
    return {
      taskId: `WA-MOCK-${validation.eventId}`,
      title: validation.taskCandidate.title,
      summary: validation.taskCandidate.summary,
      source: "whatsapp-mock-contract",
      sourceLabel: "WhatsApp mock contract",
      status: "review_pending",
      priority: validation.taskCandidate.priority,
      updatedAt: validation.receivedAt,
      nextStep: validation.taskCandidate.nextStep,
      reviewRequired: true
    };
  }

  function buildWhatsAppMockContractSummary(events) {
    const inputs = Array.isArray(events) ? events : [events];
    const validations = inputs.map(validateWhatsAppMockEvent);
    const taskCandidates = validations.map(mapWhatsAppMockEventToTaskCandidate).filter(Boolean);
    return {
      eventCount: validations.length,
      safeCandidateCount: validations.filter((event) => event.contractStatus === "safe-candidate").length,
      reviewRequiredCount: validations.filter((event) => event.contractStatus === "review-required").length,
      unsafeRejectedCount: validations.filter((event) => event.contractStatus === "unsafe-rejected").length,
      ignoredEventCount: validations.filter((event) => event.contractStatus === "ignored-non-task-event").length,
      taskCandidates,
      warnings: validations.flatMap((event) => event.warnings),
      unsafeReasons: validations.flatMap((event) => event.unsafeReasons),
      mockOnly: true,
      networkCallsMade: false,
      webhookRouteAdded: false,
      apiClientAdded: false,
      authEnabled: false,
      productionReady: false,
      rawChatPrinted: false,
      secretRedactionApplied: true
    };
  }

  window.OpenClawWhatsAppSyncMockContract = {
    SCHEMA_VERSION,
    EVENT_TYPES,
    validateWhatsAppMockEvent,
    normalizeWhatsAppMockEvent,
    mapWhatsAppMockEventToTaskCandidate,
    buildWhatsAppMockContractSummary,
    redactWhatsAppMockText
  };
})();
