import assert from "node:assert/strict";
import test from "node:test";
import { createRichTextAtRegistry } from "../plugins/atRegistry.ts";
import {
  createRichTextAtProvider,
  createRichTextTextInsertResult
} from "../plugins/at.ts";
import type { RichTextAtProvider } from "../types/at.ts";
import {
  findRichTextAtQuery,
  queryRichTextAtMatches
} from "./richTextAtQuery.ts";

test("findRichTextAtQuery supports @ after punctuation boundaries", () => {
  assert.deepEqual(findRichTextAtQuery("hello, @rea", 11), {
    from: 7,
    to: 11,
    keyword: "rea"
  });
  assert.deepEqual(findRichTextAtQuery("see(@rea", 8), {
    from: 4,
    to: 8,
    keyword: "rea"
  });
});

test("findRichTextAtQuery keeps slash and dot inside the query", () => {
  assert.deepEqual(findRichTextAtQuery("@src/index.ts", 13), {
    from: 0,
    to: 13,
    keyword: "src/index.ts"
  });
});

test("findRichTextAtQuery ignores @ inside email-like tokens", () => {
  assert.equal(findRichTextAtQuery("alice@example", 13), null);
});

test("queryRichTextAtMatches returns empty results when a provider throws", async () => {
  const registry = createRichTextAtRegistry([
    createRichTextAtProvider({
      id: "broken",
      async query() {
        throw new Error("search failed");
      },
      getItemKey: () => "broken",
      getItemLabel: () => "broken",
      toInsertResult: () => createRichTextTextInsertResult("broken")
    })
  ]);

  const matches = await queryRichTextAtMatches(registry, {
    context: {},
    keyword: "rea",
    maxResults: 5
  });

  assert.deepEqual(matches, []);
});

test("queryRichTextAtMatches returns empty results after abort", async () => {
  const registry = createRichTextAtRegistry([
    createRichTextAtProvider({
      id: "slow",
      async query() {
        await Promise.resolve();
        return [{ id: "readme" }];
      },
      getItemKey: (item) => item.id,
      getItemLabel: (item) => item.id,
      toInsertResult: (item) => createRichTextTextInsertResult(item.id)
    }) as RichTextAtProvider<unknown>
  ]);
  const abortController = new AbortController();

  const matchesPromise = queryRichTextAtMatches(registry, {
    abortSignal: abortController.signal,
    context: {},
    keyword: "rea",
    maxResults: 5
  });
  abortController.abort();

  const matches = await matchesPromise;
  assert.deepEqual(matches, []);
});
