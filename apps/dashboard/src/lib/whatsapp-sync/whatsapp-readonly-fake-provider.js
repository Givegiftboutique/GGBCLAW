(function () {
  const PROVIDER_NAME = "whatsapp-readonly-fake-provider";
  const PROVIDER_MODE = "offline-fixture-only";
  const FIXTURE_SCHEMA_VERSION = "whatsapp-readonly-fake-provider-events.v1";

  const SENSITIVE_RE = /\b(api\s*key|password|secret|credential|authorization|bearer)\b/i;
  const PHONE_RE = /(?:\+?\d[\s().-]?){8,}/;
  const RAW_CHAT_RE = /\b(chat export|message history|forwarded many times|end-to-end encrypted|media omitted)\b/i;

  function loadContract() {
    if (typeof window !== "undefined" && window.OpenClawWhatsAppSyncMockContract) {
      return window.OpenClawWhatsAppSyncMockContract;
    }
    return null;
  }

  function redactText(input) {
    return String(input ?? "")
      .replace(SENSITIVE_RE, "[redacted-sensitive-word]")
      .replace(PHONE_RE, "[redacted-phone]")
      .replace(RAW_CHAT_RE, "[redacted-raw-chat-marker]")
      .trim();
  }

  function normalizeTaskCandidate(input) {
    const task = input && typeof input === "object" ? input : {};
    return {
      title: redactText(task.title || "Review WhatsApp fake provider event"),
      summary: redactText(task.summary || "Review sanitized fake provider event."),
      priority: ["low", "normal", "high", "urgent"].includes(task.priority) ? task.priority : "normal",
      status: ["review_pending", "todo", "in-progress", "done", "failed", "cancelled"].includes(task.status) ? task.status : "review_pending",
      nextStep: redactText(task.nextStep || "Operator review required before any local task creation.")
    };
  }

  function normalizeWhatsAppFakeProviderEvent(input) {
    const event = input && typeof input === "object" ? input : {};
    return {
      providerEventId: redactText(event.providerEventId || "fake_provider_evt_unknown"),
      eventType: event.eventType || "message.created",
      receivedAt: event.receivedAt || new Date(0).toISOString(),
      safeSenderLabel: redactText(event.safeSenderLabel || "customer_mock_unknown"),
      textSummary: redactText(event.textSummary || ""),
      rawTextIncluded: event.rawTextIncluded === true,
      phoneNumberIncluded: event.phoneNumberIncluded === true,
      mediaIncluded: event.mediaIncluded === true,
      taskCandidate: normalizeTaskCandidate(event.taskCandidate),
      fixtureOnly: true,
      readOnly: true,
      secretRedactionApplied: true
    };
  }

  function redactFakeProviderEvent(input) {
    const event = normalizeWhatsAppFakeProviderEvent(input);
    return {
      ...event,
      rawPayloadIncluded: false,
      rawChatIncluded: false,
      rawPayloadPrinted: false,
      rawChatPrinted: false,
      phoneNumberIncluded: false,
      secretRedactionApplied: true
    };
  }

  function mapFakeProviderEventToMockContract(input) {
    const event = redactFakeProviderEvent(input);
    const mapped = {
      schemaVersion: "whatsapp-sync-mock-event.v1",
      eventId: event.providerEventId,
      eventType: event.eventType,
      receivedAt: event.receivedAt,
      sender: {
        safeLabel: event.safeSenderLabel,
        phoneNumberIncluded: false
      },
      message: {
        messageId: `fake_provider_msg_${event.providerEventId}`,
        textSummary: event.textSummary,
        rawTextIncluded: false,
        mediaIncluded: event.mediaIncluded === true
      },
      taskCandidate: event.taskCandidate,
      safety: {
        localOnly: true,
        mockOnly: true,
        containsRawChat: false,
        containsPhoneNumbers: false,
        containsCredentials: false,
        operatorReviewRequired: true,
        secretRedactionApplied: true
      }
    };
    const contract = loadContract();
    return contract ? contract.normalizeWhatsAppMockEvent(mapped) : mapped;
  }

  function createWhatsAppReadonlyFakeProvider(options = {}) {
    const fixture = options.fixtureData && typeof options.fixtureData === "object" ? options.fixtureData : {};
    const fixtureEvents = Array.isArray(options.events)
      ? options.events
      : Array.isArray(fixture.events)
        ? fixture.events
        : [];
    const sanitizedEvents = fixtureEvents.map(redactFakeProviderEvent);
    return {
      providerName: PROVIDER_NAME,
      providerMode: PROVIDER_MODE,
      readOnly: true,
      networkCallsMade: false,
      webhookRouteAdded: false,
      apiClientAdded: false,
      authEnabled: false,
      productionReady: false,
      listRecentEvents: async ({ cursor = null, limit = sanitizedEvents.length } = {}) => {
        const start = cursor ? Number(cursor) || 0 : 0;
        const safeLimit = Math.max(0, Math.min(Number(limit) || sanitizedEvents.length, sanitizedEvents.length));
        const events = sanitizedEvents.slice(start, start + safeLimit);
        const nextIndex = start + events.length;
        return {
          events,
          nextCursor: nextIndex < sanitizedEvents.length ? String(nextIndex) : null
        };
      }
    };
  }

  async function listWhatsAppFakeProviderEvents(provider, options = {}) {
    if (!provider || provider.providerName !== PROVIDER_NAME) {
      throw new Error("WhatsApp read-only fake provider is required.");
    }
    const result = await provider.listRecentEvents({
      cursor: options.cursor ?? null,
      limit: options.limit ?? undefined
    });
    return {
      ...result,
      events: Array.isArray(result.events) ? result.events.map(redactFakeProviderEvent) : []
    };
  }

  function buildWhatsAppFakeProviderSummary(result) {
    const events = Array.isArray(result?.events) ? result.events : [];
    const mappedEvents = events.map(mapFakeProviderEventToMockContract);
    const contract = loadContract();
    const contractSummary = contract ? contract.buildWhatsAppMockContractSummary(mappedEvents) : null;
    return {
      providerName: PROVIDER_NAME,
      providerMode: PROVIDER_MODE,
      readOnly: true,
      mockOnly: true,
      fixtureOnly: true,
      networkCallsMade: false,
      webhookRouteAdded: false,
      httpListenerStarted: false,
      apiClientAdded: false,
      authEnabled: false,
      sendMessageEnabled: false,
      autoReplyEnabled: false,
      mutationEnabled: false,
      productionReady: false,
      eventCount: events.length,
      mappedEvents,
      safeCandidateCount: contractSummary?.safeCandidateCount ?? 0,
      reviewRequiredCount: contractSummary?.reviewRequiredCount ?? 0,
      unsafeRejectedCount: contractSummary?.unsafeRejectedCount ?? 0,
      rawPayloadPrinted: false,
      rawChatPrinted: false,
      secretRedactionApplied: true,
      warnings: contractSummary?.warnings ?? [],
      safeNextSteps: [
        "Review sanitized fake provider candidates offline.",
        "Keep this provider fixture-only until a separate approved preflight sprint."
      ]
    };
  }

  window.OpenClawWhatsAppReadonlyFakeProvider = {
    PROVIDER_NAME,
    PROVIDER_MODE,
    FIXTURE_SCHEMA_VERSION,
    createWhatsAppReadonlyFakeProvider,
    listWhatsAppFakeProviderEvents,
    normalizeWhatsAppFakeProviderEvent,
    mapFakeProviderEventToMockContract,
    buildWhatsAppFakeProviderSummary,
    redactFakeProviderEvent
  };
})();
