import assert from "node:assert/strict";
import test from "node:test";
import type { BrowserNodeEvent } from "@tutti-os/browser-node";
import type { ReporterEventInput } from "../../../analytics/services/reporterService.interface.ts";
import {
  createWorkspaceBrowserAnalyticsApi,
  createWorkspaceBrowserAnalyticsTracker
} from "./workspaceBrowserAnalytics.ts";

test("workspace browser analytics reports open and close without navigation events", async () => {
  const reporterCalls: ReporterEventInput[][] = [];
  let now = 1749124800000;
  const tracker = createWorkspaceBrowserAnalyticsTracker({
    reporterNow: () => now,
    reporterService: createReporterService(reporterCalls)
  });
  const lease = tracker.createNodeLease({
    node: {
      id: "browser-node"
    },
    workspaceId: "workspace-browser-events"
  } as never);

  tracker.observeEvent(
    createBrowserStateEvent({
      isLoading: true,
      url: "https://example.com/loading"
    })
  );
  tracker.observeEvent(
    createBrowserStateEvent({
      isLoading: false,
      url: "https://example.com/done"
    })
  );
  tracker.observeEvent(
    createBrowserStateEvent({
      isLoading: false,
      url: "https://example.com/done"
    })
  );
  tracker.observeEvent(
    createBrowserStateEvent({
      isLoading: false,
      url: "http://127.0.0.1:3000/"
    })
  );
  now = 1749124800450;
  tracker.observeEvent({
    nodeId: "browser-node",
    type: "closed"
  });
  lease?.release();
  await Promise.resolve();

  assert.deepEqual(reporterCalls, [
    [
      {
        clientTS: 1749124800000,
        name: "browser.opened",
        params: {
          source: "restore",
          trigger: "automatic"
        }
      }
    ],
    [
      {
        clientTS: 1749124800450,
        name: "browser.closed",
        params: {
          duration_ms: 450
        }
      }
    ]
  ]);
  assert.equal(reporterCalls.length, 2);
});

test("workspace browser analytics prefers node launch source over early runtime active events", async () => {
  const reporterCalls: ReporterEventInput[][] = [];
  let now = 1749124803000;
  const tracker = createWorkspaceBrowserAnalyticsTracker({
    reporterNow: () => now,
    reporterService: createReporterService(reporterCalls)
  });

  tracker.observeEvent(
    createBrowserStateEvent({
      lifecycle: "active",
      nodeId: "browser-node",
      url: "https://example.com/runtime-open"
    })
  );
  const lease = tracker.createNodeLease({
    node: {
      data: {
        launchSource: "launchpad"
      },
      id: "browser-node"
    },
    workspaceId: "workspace-browser-events"
  } as never);
  await waitForTimers();

  assert.deepEqual(reporterCalls, [
    [
      {
        clientTS: 1749124803000,
        name: "browser.opened",
        params: {
          source: "launchpad",
          trigger: "manual"
        }
      }
    ]
  ]);

  now = 1749124803200;
  lease?.release();
  await Promise.resolve();

  assert.equal(reporterCalls[1]?.[0]?.name, "browser.closed");
});

test("workspace browser analytics keeps node lease close reporting when raw closed arrives first", async () => {
  const reporterCalls: ReporterEventInput[][] = [];
  let now = 1749124802000;
  const tracker = createWorkspaceBrowserAnalyticsTracker({
    reporterNow: () => now,
    reporterService: createReporterService(reporterCalls)
  });
  const lease = tracker.createNodeLease({
    node: {
      id: "browser-node"
    },
    workspaceId: "workspace-browser-events"
  } as never);

  now = 1749124802200;
  tracker.observeEvent({
    nodeId: "browser-node",
    type: "closed"
  });
  await Promise.resolve();

  assert.deepEqual(reporterCalls, [
    [
      {
        clientTS: 1749124802000,
        name: "browser.opened",
        params: {
          source: "restore",
          trigger: "automatic"
        }
      }
    ]
  ]);

  now = 1749124802250;
  lease?.release();
  await Promise.resolve();

  assert.deepEqual(reporterCalls, [
    [
      {
        clientTS: 1749124802000,
        name: "browser.opened",
        params: {
          source: "restore",
          trigger: "automatic"
        }
      }
    ],
    [
      {
        clientTS: 1749124802250,
        name: "browser.closed",
        params: {
          duration_ms: 250
        }
      }
    ]
  ]);
});

test("workspace browser analytics reports open and close from runtime events when no node lease exists", async () => {
  const reporterCalls: ReporterEventInput[][] = [];
  let now = 1749124801000;
  const tracker = createWorkspaceBrowserAnalyticsTracker({
    reporterNow: () => now,
    reporterService: createReporterService(reporterCalls)
  });

  tracker.observeEvent(
    createBrowserStateEvent({
      lifecycle: "active",
      nodeId: "browser-runtime-node",
      url: "https://example.com/runtime-open"
    })
  );
  tracker.observeEvent(
    createBrowserStateEvent({
      lifecycle: "active",
      nodeId: "browser-runtime-node",
      url: "https://example.com/runtime-open"
    })
  );
  await waitForTimers();
  now = 1749124801250;
  tracker.observeEvent({
    nodeId: "browser-runtime-node",
    type: "closed"
  });
  await Promise.resolve();

  assert.deepEqual(reporterCalls, [
    [
      {
        clientTS: 1749124801000,
        name: "browser.opened",
        params: {
          source: "restore",
          trigger: "automatic"
        }
      }
    ],
    [
      {
        clientTS: 1749124801250,
        name: "browser.closed",
        params: {
          duration_ms: 250
        }
      }
    ]
  ]);
});

test("workspace browser analytics api observes each raw event once across subscribers", () => {
  const observedEvents: BrowserNodeEvent[] = [];
  const listenerEvents: BrowserNodeEvent[] = [];
  const rawListeners: Array<(event: BrowserNodeEvent) => void> = [];
  let rawSubscriptionCount = 0;
  const api = createWorkspaceBrowserAnalyticsApi({
    browserApi: {
      ...createBrowserApiStub(),
      onEvent(listener) {
        rawSubscriptionCount += 1;
        rawListeners.push(listener);
        return () => {
          rawListeners.length = 0;
        };
      }
    },
    tracker: {
      observeEvent(event) {
        observedEvents.push(event);
      }
    }
  });
  const firstDispose = api.onEvent((event) => listenerEvents.push(event));
  const secondDispose = api.onEvent((event) => listenerEvents.push(event));
  const event = createBrowserStateEvent({ url: "https://example.com/" });
  assert.ok(rawListeners[0]);

  rawListeners[0](event);

  assert.equal(rawSubscriptionCount, 1);
  assert.deepEqual(listenerEvents, [event, event]);
  assert.deepEqual(observedEvents, [event]);

  firstDispose();
  assert.equal(rawListeners.length, 1);
  secondDispose();
  assert.equal(rawListeners.length, 0);
});

function createBrowserStateEvent(
  overrides: Partial<Extract<BrowserNodeEvent, { type: "state" }>>
): Extract<BrowserNodeEvent, { type: "state" }> {
  return {
    canGoBack: false,
    canGoForward: false,
    isAttachedToWindow: true,
    isLoading: false,
    isOccluded: false,
    lifecycle: "active",
    nodeId: "browser-node",
    title: null,
    type: "state",
    url: "https://example.com/",
    ...overrides
  };
}

function waitForTimers() {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, 0);
  });
}

function createReporterService(calls: ReporterEventInput[][] = []) {
  return {
    async trackEvents(events: ReporterEventInput[]) {
      calls.push(events);
    }
  };
}

function createBrowserApiStub() {
  return {
    activate: async () => undefined,
    capturePreview: async () => null,
    close: async () => undefined,
    goBack: async () => undefined,
    goForward: async () => undefined,
    navigate: async () => undefined,
    onEvent: () => () => undefined,
    openExternal: async () => undefined,
    prepareSession: async () => undefined,
    registerGuest: async () => undefined,
    reload: async () => undefined,
    unregisterGuest: async () => undefined
  };
}
