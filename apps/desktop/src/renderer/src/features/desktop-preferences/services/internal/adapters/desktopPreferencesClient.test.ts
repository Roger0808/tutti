import assert from "node:assert/strict";
import test from "node:test";
import type {
  DesktopPreferencesStateResponse,
  NextopdEventStreamClient,
  NextopdClient,
  PutDesktopPreferencesRequest
} from "@tutti-os/client-nextopd-ts";
import { createDesktopPreferencesClient } from "./desktopPreferencesClient.ts";

test("desktop preferences client resolves writes from the authoritative event", async () => {
  const eventStreamClient = createFakeEventStreamClient();
  const client = createDesktopPreferencesClient(
    createFakeNextopdClient(),
    eventStreamClient
  );

  const completion = client.updateDesktopPreferences({
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });

  assert.deepEqual(eventStreamClient.publishedIntents, [
    {
      payload: {
        preferences: {
          agentComposerDefaultsByProvider: {},
          defaultAgentProvider: "codex",

          dockIconStyle: "default",
          dockPlacement: "bottom",
          locale: "zh-CN",
          sleepPreventionMode: "never",
          themeSource: "dark"
        }
      },
      topic: "preferences.desktop.update.requested"
    }
  ]);

  eventStreamClient.emitDesktopPreferencesUpdated({
    initialized: true,
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });

  assert.deepEqual(await completion, {
    agentComposerDefaultsByProvider: {},
    defaultAgentProvider: "codex",

    dockIconStyle: "default",
    dockPlacement: "bottom",
    locale: "zh-CN",
    sleepPreventionMode: "never",
    themeSource: "dark"
  });

  client.dispose();
});

test("desktop preferences client fans out authoritative preference updates", async () => {
  const eventStreamClient = createFakeEventStreamClient();
  const client = createDesktopPreferencesClient(
    createFakeNextopdClient(),
    eventStreamClient
  );
  const receivedUpdates: DesktopPreferencesStateResponse["preferences"][] = [];

  const unsubscribe = client.subscribeToDesktopPreferencesUpdated(
    (preferences) => {
      receivedUpdates.push(preferences);
    }
  );

  eventStreamClient.emitDesktopPreferencesUpdated({
    initialized: true,
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });

  assert.deepEqual(receivedUpdates, [
    {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  ]);

  unsubscribe();
  client.dispose();
});

test("desktop preferences client rejects pending writes when disposed", async () => {
  const eventStreamClient = createFakeEventStreamClient();
  const client = createDesktopPreferencesClient(
    createFakeNextopdClient(),
    eventStreamClient
  );

  const completion = client.updateDesktopPreferences({
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });

  client.dispose();

  await assert.rejects(completion, /disposed/);
  assert.equal(eventStreamClient.disposeCalls, 0);
});

test("desktop preferences client confirms writes from HTTP when the event does not arrive", async () => {
  const nextopdClient = createFakeNextopdClient({
    initialized: true,
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });
  const eventStreamClient = createFakeEventStreamClient();
  const client = createDesktopPreferencesClient(
    nextopdClient,
    eventStreamClient,
    {
      authoritativeEventTimeoutMs: 0
    }
  );

  const completion = client.updateDesktopPreferences({
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });

  assert.deepEqual(await completion, {
    agentComposerDefaultsByProvider: {},
    defaultAgentProvider: "codex",

    dockIconStyle: "default",
    dockPlacement: "bottom",
    locale: "zh-CN",
    sleepPreventionMode: "never",
    themeSource: "dark"
  });
  assert.equal(nextopdClient.getDesktopPreferencesCalls, 1);

  client.dispose();
});

test("desktop preferences client notifies subscribers when HTTP confirmation succeeds without an event", async () => {
  const nextopdClient = createFakeNextopdClient({
    initialized: true,
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });
  const eventStreamClient = createFakeEventStreamClient();
  const client = createDesktopPreferencesClient(
    nextopdClient,
    eventStreamClient,
    {
      authoritativeEventTimeoutMs: 0
    }
  );
  const receivedUpdates: DesktopPreferencesStateResponse["preferences"][] = [];

  client.subscribeToDesktopPreferencesUpdated((preferences) => {
    receivedUpdates.push(preferences);
  });

  await client.updateDesktopPreferences({
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });

  assert.deepEqual(receivedUpdates, [
    {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  ]);

  client.dispose();
});

test("desktop preferences client rejects writes when the authoritative state cannot be confirmed", async () => {
  const nextopdClient = createFakeNextopdClient({
    initialized: true,
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "en",
      sleepPreventionMode: "never",
      themeSource: "system"
    }
  });
  const eventStreamClient = createFakeEventStreamClient();
  const client = createDesktopPreferencesClient(
    nextopdClient,
    eventStreamClient,
    {
      authoritativeEventTimeoutMs: 0
    }
  );

  const completion = client.updateDesktopPreferences({
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });

  await assert.rejects(completion, /authoritative update did not arrive/);
  assert.equal(nextopdClient.getDesktopPreferencesCalls, 1);

  client.dispose();
});

test("desktop preferences client coalesces concurrent identical writes", async () => {
  const nextopdClient = createFakeNextopdClient();
  const eventStreamClient = createFakeEventStreamClient();
  const client = createDesktopPreferencesClient(
    nextopdClient,
    eventStreamClient,
    {
      authoritativeEventTimeoutMs: 5_000
    }
  );

  const firstCompletion = client.updateDesktopPreferences({
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });
  const secondCompletion = client.updateDesktopPreferences({
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });

  assert.equal(eventStreamClient.publishedIntents.length, 1);

  eventStreamClient.emitDesktopPreferencesUpdated({
    initialized: true,
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "zh-CN",
      sleepPreventionMode: "never",
      themeSource: "dark"
    }
  });

  const [firstResult, secondResult] = await Promise.all([
    firstCompletion,
    secondCompletion
  ]);
  assert.deepEqual(firstResult, secondResult);

  client.dispose();
});

function createFakeNextopdClient(
  response: DesktopPreferencesStateResponse = {
    initialized: true,
    preferences: {
      agentComposerDefaultsByProvider: {},
      defaultAgentProvider: "codex",

      dockIconStyle: "default",
      dockPlacement: "bottom",
      locale: "en",
      sleepPreventionMode: "never",
      themeSource: "system"
    }
  }
): Pick<NextopdClient, "getDesktopPreferences"> & {
  getDesktopPreferencesCalls: number;
} {
  let getDesktopPreferencesCalls = 0;

  return {
    get getDesktopPreferencesCalls() {
      return getDesktopPreferencesCalls;
    },
    getDesktopPreferences: async () => {
      getDesktopPreferencesCalls += 1;
      return response;
    }
  };
}

function createFakeEventStreamClient(): NextopdEventStreamClient & {
  disposeCalls: number;
  emitDesktopPreferencesUpdated(
    payload: Extract<DesktopPreferencesStateResponse, { initialized: boolean }>
  ): void;
  publishedIntents: Array<{
    payload: PutDesktopPreferencesRequest;
    topic: "preferences.desktop.update.requested";
  }>;
} {
  const listeners = new Set<
    (event: {
      emittedAt: string;
      id: string;
      payload: Extract<
        DesktopPreferencesStateResponse,
        { initialized: boolean }
      >;
      topic: "preferences.desktop.updated";
      version: 1;
    }) => void
  >();
  const publishedIntents: Array<{
    payload: PutDesktopPreferencesRequest;
    topic: "preferences.desktop.update.requested";
  }> = [];
  let disposeCalls = 0;

  return {
    connect: async () => {},
    dispose() {
      disposeCalls += 1;
    },
    get disposeCalls() {
      return disposeCalls;
    },
    emitDesktopPreferencesUpdated(payload) {
      for (const listener of listeners) {
        listener({
          emittedAt: "2026-05-30T08:00:00Z",
          id: "evt-1",
          payload,
          topic: "preferences.desktop.updated",
          version: 1
        });
      }
    },
    async publishIntent(topic, payload) {
      publishedIntents.push({
        payload,
        topic
      });
    },
    publishedIntents,
    subscribe(topic, listener) {
      assert.equal(topic, "preferences.desktop.updated");
      listeners.add(listener as Parameters<typeof listeners.add>[0]);
      return () => {
        listeners.delete(listener as Parameters<typeof listeners.add>[0]);
      };
    },
    subscribeConnectionState() {
      return () => {};
    }
  };
}
