import assert from "node:assert/strict";
import test from "node:test";
import type { ReporterEventInput } from "../reporterService.interface.ts";
import {
  startPredefinePageviewAnalytics,
  type PredefinePageviewAnalyticsRuntime,
  type PredefinePageviewAnalyticsStorage
} from "./predefinePageviewAnalytics.ts";

test("predefine pageview analytics reports once for a visible local day", () => {
  const reporterCalls: ReporterEventInput[][] = [];
  const runtime = createRuntimeHarness();
  const storage = createStorageHarness();
  const analytics = startPredefinePageviewAnalytics({
    reporterService: createReporterService(reporterCalls),
    reporterNow: () => runtime.now(),
    runtime,
    storage
  });

  analytics.reportToday();

  assert.deepEqual(reporterCalls, [
    [
      {
        clientTS: runtime.now(),
        name: "predefine_pageview"
      }
    ]
  ]);
});

test("predefine pageview analytics skips a day already reported by another window", () => {
  const reporterCalls: ReporterEventInput[][] = [];
  const runtime = createRuntimeHarness();
  const storage = createStorageHarness({
    reportedDay: "2026-06-09"
  });

  startPredefinePageviewAnalytics({
    reporterService: createReporterService(reporterCalls),
    reporterNow: () => runtime.now(),
    runtime,
    storage
  });

  assert.deepEqual(reporterCalls, []);
});

test("predefine pageview analytics reports when a resident app crosses local day", () => {
  const reporterCalls: ReporterEventInput[][] = [];
  const runtime = createRuntimeHarness({
    now: new Date(2026, 5, 9, 23, 59, 50).getTime()
  });
  const storage = createStorageHarness();

  startPredefinePageviewAnalytics({
    reporterService: createReporterService(reporterCalls),
    reporterNow: () => runtime.now(),
    runtime,
    storage
  });
  runtime.advanceTo(new Date(2026, 5, 10, 0, 0, 0).getTime());
  runtime.flushDueTimers();

  assert.equal(reporterCalls.length, 2);
  assert.deepEqual(
    reporterCalls.map((call) => call[0]?.name),
    ["predefine_pageview", "predefine_pageview"]
  );
});

test("predefine pageview analytics reports a new day on foreground restore", () => {
  const reporterCalls: ReporterEventInput[][] = [];
  const runtime = createRuntimeHarness();
  const storage = createStorageHarness();

  startPredefinePageviewAnalytics({
    reporterService: createReporterService(reporterCalls),
    reporterNow: () => runtime.now(),
    runtime,
    storage
  });
  runtime.visibilityState = "hidden";
  runtime.emitVisibilityChange();
  runtime.advanceTo(new Date(2026, 5, 10, 10, 0, 0).getTime());
  runtime.visibilityState = "visible";
  runtime.emitVisibilityChange();

  assert.equal(reporterCalls.length, 2);
});

function createReporterService(calls: ReporterEventInput[][] = []) {
  return {
    async trackEvents(events: ReporterEventInput[]) {
      calls.push(events);
    }
  };
}

function createRuntimeHarness(input: { now?: number } = {}) {
  let now = input.now ?? new Date(2026, 5, 9, 10, 0, 0).getTime();
  const visibilityListeners = new Set<() => void>();
  const timers: Array<{ active: boolean; dueAt: number; task: () => void }> =
    [];
  const runtime: PredefinePageviewAnalyticsRuntime & {
    advanceTo(nextNow: number): void;
    emitVisibilityChange(): void;
    flushDueTimers(): void;
    now(): number;
    visibilityState: DocumentVisibilityState;
  } = {
    visibilityState: "visible",
    addVisibilityChangeListener(listener) {
      visibilityListeners.add(listener);
      return () => {
        visibilityListeners.delete(listener);
      };
    },
    advanceTo(nextNow) {
      now = nextNow;
    },
    clearTimeout(handle) {
      const timer = handle as { active: boolean };
      timer.active = false;
    },
    emitVisibilityChange() {
      for (const listener of [...visibilityListeners]) {
        listener();
      }
    },
    flushDueTimers() {
      for (const timer of timers) {
        if (timer.active && timer.dueAt <= now) {
          timer.active = false;
          timer.task();
        }
      }
    },
    getVisibilityState() {
      return runtime.visibilityState;
    },
    now() {
      return now;
    },
    setTimeout(task, delayMs) {
      const timer = {
        active: true,
        dueAt: now + delayMs,
        task
      };
      timers.push(timer);
      return timer;
    }
  };
  return runtime;
}

function createStorageHarness(input: { reportedDay?: string } = {}) {
  let reportedDay = input.reportedDay ?? null;
  return {
    getReportedDay() {
      return reportedDay;
    },
    setReportedDay(dayKey) {
      reportedDay = dayKey;
    }
  } satisfies PredefinePageviewAnalyticsStorage;
}
