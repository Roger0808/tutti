import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveIssueManagerFloatingNoticeViewState } from "./IssueManagerNoticeState.ts";

const floatingNoticeSource = readFileSync(
  new URL(
    "../../../internal/shell/IssueManagerFloatingNotice.tsx",
    import.meta.url
  ),
  "utf8"
);

test("floating notice state returns null when there is no notification", () => {
  assert.equal(
    resolveIssueManagerFloatingNoticeViewState({
      notification: null
    }),
    null
  );
});

test("floating notice state returns a transient single-line notice model", () => {
  assert.deepEqual(
    resolveIssueManagerFloatingNoticeViewState({
      notification: {
        id: 7,
        title: "messages.runFailed",
        tone: "destructive"
      }
    }),
    {
      durationMs: 3000,
      id: 7,
      isLoading: false,
      title: "messages.runFailed",
      tone: "destructive"
    }
  );
});

test("floating notice uses public toast primitives", () => {
  assert.match(floatingNoticeSource, /ToastRoot/);
  assert.match(floatingNoticeSource, /ToastTitle/);
  assert.doesNotMatch(floatingNoticeSource, /toastVariants/);
});

test("floating notice allows long messages to wrap inside the toast", () => {
  assert.doesNotMatch(floatingNoticeSource, /whitespace-nowrap/);
  assert.match(floatingNoticeSource, /overflow-wrap:anywhere/);
});
