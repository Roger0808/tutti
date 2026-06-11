import assert from "node:assert/strict";
import test from "node:test";
import type { NextopdClient } from "@tutti-os/client-nextopd-ts";
import type { DesktopHostFilesApi } from "@preload/types";
import { createDesktopWorkspaceFileReferenceAdapter } from "./createDesktopWorkspaceFileReferenceAdapter.ts";

test("desktop workspace file reference adapter lets nextopd resolve the local root", async () => {
  const calls: Array<{
    method: string;
    request:
      | {
          path?: string;
          prefetchBudgetMs?: number;
          prefetchDepth?: number;
        }
      | undefined;
  }> = [];
  const adapter = createDesktopWorkspaceFileReferenceAdapter({
    hostFilesApi: {} as DesktopHostFilesApi,
    nextopdClient: {
      async getWorkspaceFileTreeSnapshot(
        _workspaceId: string,
        request:
          | {
              path?: string;
              prefetchBudgetMs?: number;
              prefetchDepth?: number;
            }
          | undefined
      ) {
        calls.push({ method: "tree", request });
        return {
          budgetExceeded: false,
          directory: {
            directoryPath: "/Users/test/project/nextop",
            entries: [
              {
                kind: "directory",
                name: "superpowers",
                path: "/Users/test/project/nextop/superpowers"
              }
            ],
            prefetchState: "loaded"
          },
          prefetchBudgetMs: 500,
          prefetchDepth: 4,
          root: "/Users/test/project/nextop"
        };
      },
      async listWorkspaceFileDirectory(
        _workspaceId: string,
        request: { path?: string } = {}
      ) {
        calls.push({ method: "list", request });
        return {
          directoryPath: "/Users/test/project/nextop",
          entries: [
            {
              kind: "directory",
              name: "superpowers",
              path: "/Users/test/project/nextop/superpowers"
            }
          ],
          root: "/Users/test/project/nextop",
          workspaceId: "workspace-1"
        };
      }
    } as unknown as NextopdClient,
    workspaceId: "workspace-1"
  });

  const snapshot = await adapter.loadReferenceTree?.({
    workspaceId: "workspace-1"
  });
  const listing = await adapter.listDirectory?.({
    workspaceId: "workspace-1"
  });

  assert.deepEqual(calls, [
    {
      method: "tree",
      request: {
        path: undefined,
        prefetchBudgetMs: 500,
        prefetchDepth: 4
      }
    },
    {
      method: "list",
      request: {
        path: undefined
      }
    }
  ]);
  assert.equal(snapshot?.rootPath, "/Users/test/project/nextop");
  assert.equal(
    snapshot?.directory.entries[0]?.path,
    "/Users/test/project/nextop/superpowers"
  );
  assert.equal(listing?.rootPath, "/Users/test/project/nextop");
  assert.equal(listing?.directoryPath, "/Users/test/project/nextop");
  assert.equal(
    listing?.entries[0]?.path,
    "/Users/test/project/nextop/superpowers"
  );
});

test("desktop workspace file reference adapter passes search abort signals to nextopd", async () => {
  const abortController = new AbortController();
  let observedSignal: AbortSignal | undefined;
  const adapter = createDesktopWorkspaceFileReferenceAdapter({
    hostFilesApi: {} as DesktopHostFilesApi,
    nextopdClient: {
      async searchWorkspaceFiles(
        _workspaceId: string,
        _request: Parameters<NextopdClient["searchWorkspaceFiles"]>[1],
        requestOptions?: Parameters<NextopdClient["searchWorkspaceFiles"]>[2]
      ) {
        observedSignal = requestOptions?.signal ?? undefined;
        return {
          entries: [],
          root: "/Users/test/project/nextop",
          workspaceId: "workspace-1"
        };
      }
    } as unknown as NextopdClient,
    workspaceId: "workspace-1"
  });

  await adapter.searchReferences?.({
    query: "nextop",
    signal: abortController.signal,
    workspaceId: "workspace-1"
  });

  assert.equal(observedSignal, abortController.signal);
});
