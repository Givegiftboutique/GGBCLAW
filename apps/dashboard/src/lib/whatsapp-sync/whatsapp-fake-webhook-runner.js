(function () {
  const RUNNER_SCOPE = "whatsapp-fake-webhook-fixture-runner";
  const SAFE_ACTIONS = ["create-review-candidate", "quarantine-review-required", "reject-unsafe", "ignore-non-task"];

  function loadContract() {
    if (typeof window !== "undefined" && window.OpenClawWhatsAppSyncMockContract) {
      return window.OpenClawWhatsAppSyncMockContract;
    }
    return null;
  }

  function normalizeScenario(input, index) {
    const scenario = input && typeof input === "object" ? input : {};
    const events = Array.isArray(scenario.events) ? scenario.events : [];
    return {
      scenarioId: String(scenario.scenarioId || `wa-fake-webhook-scenario-${index + 1}`),
      description: String(scenario.description || "Offline fake webhook fixture scenario."),
      expectedAction: SAFE_ACTIONS.includes(scenario.expectedAction) ? scenario.expectedAction : "quarantine-review-required",
      events,
      mockOnly: true,
      fixtureOnly: true
    };
  }

  function runWhatsAppFakeWebhookScenario(input, index, contractOverride) {
    const contract = contractOverride || loadContract();
    if (!contract) throw new Error("WhatsApp mock contract is required.");
    const scenario = normalizeScenario(input, index);
    const validations = scenario.events.map((event) => contract.validateWhatsAppMockEvent(event));
    const taskCandidates = validations
      .map((event) => contract.mapWhatsAppMockEventToTaskCandidate(event))
      .filter(Boolean);
    const reviewQueue = taskCandidates.map((task, taskIndex) => ({
      queueId: `${scenario.scenarioId}-review-${taskIndex + 1}`,
      scenarioId: scenario.scenarioId,
      title: task.title,
      summary: task.summary,
      status: "review_required",
      source: "whatsapp-fake-webhook-fixture",
      nextStep: "Operator review required before local task creation.",
      rawPayloadIncluded: false,
      rawChatIncluded: false,
      secretRedactionApplied: true
    }));
    const unsafeRejectedCount = validations.filter((event) => event.contractStatus === "unsafe-rejected").length;
    const reviewRequiredCount = validations.filter((event) => event.contractStatus === "review-required").length + reviewQueue.length;
    return {
      scenarioId: scenario.scenarioId,
      description: scenario.description,
      expectedAction: scenario.expectedAction,
      eventCount: validations.length,
      taskCandidateCount: taskCandidates.length,
      reviewQueueCount: reviewQueue.length,
      unsafeRejectedCount,
      reviewRequiredCount,
      reviewQueue,
      warnings: validations.flatMap((event) => event.warnings || []),
      unsafeReasons: validations.flatMap((event) => event.unsafeReasons || []),
      mockOnly: true,
      fixtureOnly: true,
      networkCallsMade: false,
      webhookRouteAdded: false,
      httpListenerStarted: false,
      apiClientAdded: false,
      authEnabled: false,
      productionReady: false,
      rawPayloadPrinted: false,
      rawChatPrinted: false,
      secretRedactionApplied: true
    };
  }

  function buildWhatsAppFakeWebhookRunnerReport(scenarios, contractOverride) {
    const inputs = Array.isArray(scenarios) ? scenarios : [scenarios];
    const scenarioResults = inputs.map((scenario, index) => runWhatsAppFakeWebhookScenario(scenario, index, contractOverride));
    const reviewQueue = scenarioResults.flatMap((scenario) => scenario.reviewQueue);
    return {
      scope: RUNNER_SCOPE,
      scenarioCount: scenarioResults.length,
      eventCount: scenarioResults.reduce((sum, scenario) => sum + scenario.eventCount, 0),
      taskCandidateCount: scenarioResults.reduce((sum, scenario) => sum + scenario.taskCandidateCount, 0),
      reviewQueueCount: reviewQueue.length,
      unsafeRejectedCount: scenarioResults.reduce((sum, scenario) => sum + scenario.unsafeRejectedCount, 0),
      reviewRequiredCount: scenarioResults.reduce((sum, scenario) => sum + scenario.reviewRequiredCount, 0),
      scenarioResults,
      reviewQueue,
      warnings: [...new Set(scenarioResults.flatMap((scenario) => scenario.warnings))],
      unsafeReasons: [...new Set(scenarioResults.flatMap((scenario) => scenario.unsafeReasons))],
      mockOnly: true,
      fixtureOnly: true,
      networkCallsMade: false,
      webhookRouteAdded: false,
      httpListenerStarted: false,
      apiClientAdded: false,
      authEnabled: false,
      productionReady: false,
      rawPayloadPrinted: false,
      rawChatPrinted: false,
      secretRedactionApplied: true
    };
  }

  window.OpenClawWhatsAppFakeWebhookRunner = {
    RUNNER_SCOPE,
    SAFE_ACTIONS,
    normalizeScenario,
    runWhatsAppFakeWebhookScenario,
    buildWhatsAppFakeWebhookRunnerReport
  };
})();
