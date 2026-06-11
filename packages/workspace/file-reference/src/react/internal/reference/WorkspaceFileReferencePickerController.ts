import { proxy } from "valtio/vanilla";
import {
  createWorkspaceFilePreviewLoadedState,
  resolveWorkspaceFilePreviewReadiness
} from "@tutti-os/workspace-file-preview";
import type {
  WorkspaceFilePreviewActivationTarget,
  WorkspaceFilePreviewReadonlyReason
} from "@tutti-os/workspace-file-preview";
import type {
  WorkspaceFileReference,
  WorkspaceFileReferenceAdapter,
  WorkspaceFileReferencePreview
} from "../../../contracts/index.ts";
import { uniqueWorkspaceFileReferences } from "../../../core/index.ts";
import {
  createWorkspaceFileReferenceDirectoryStateFromSnapshot,
  normalizeDirectoryPath,
  type WorkspaceFileReferenceDirectoryState
} from "./WorkspaceFileReferencePickerState.ts";

export type WorkspaceFileReferencePickerMode = "browse" | "search";

export type WorkspaceFileReferencePreviewState =
  | { status: "directory"; reference: WorkspaceFileReference }
  | { status: "empty" }
  | { status: "error"; reference: WorkspaceFileReference }
  | { status: "image"; objectUrl: string; reference: WorkspaceFileReference }
  | { status: "loading"; reference: WorkspaceFileReference }
  | {
      maxSizeBytes?: number;
      reason: WorkspaceFilePreviewReadonlyReason;
      reference: WorkspaceFileReference;
      status: "readonly";
    }
  | { status: "text"; content: string; reference: WorkspaceFileReference }
  | { status: "unsupported"; reference: WorkspaceFileReference }
  | { status: "unavailable"; reference: WorkspaceFileReference };

export interface WorkspaceFileReferencePickerControllerSnapshot {
  browseError: Error | null;
  browseRootPath: string | null;
  directoryStateByPath: Record<string, WorkspaceFileReferenceDirectoryState>;
  expandedFolderPaths: Record<string, boolean>;
  initialPathRevealed: boolean;
  isBrowseLoading: boolean;
  isSearchLoading: boolean;
  mode: WorkspaceFileReferencePickerMode;
  previewState: WorkspaceFileReferencePreviewState;
  searchEntries: WorkspaceFileReference[];
  searchError: Error | null;
  searchQuery: string;
}

export interface CreateWorkspaceFileReferencePickerControllerInput {
  fileAdapter?: WorkspaceFileReferenceAdapter;
  searchDebounceMs?: number;
  workspaceId: string;
}

export interface WorkspaceFileReferencePickerController {
  close(): void;
  getSnapshot(): WorkspaceFileReferencePickerControllerSnapshot;
  loadBrowseRoot(): void;
  open(): void;
  reset(): void;
  revealInitialPath(initialDirectoryPath: string): Promise<string | null>;
  setPreviewReference(reference: WorkspaceFileReference | null): void;
  setSearchQuery(query: string): void;
  readonly store: WorkspaceFileReferencePickerControllerSnapshot;
  toggleFolder(entry: WorkspaceFileReference): void;
}

const defaultDirectoryPath = "/";
const defaultSearchDebounceMs = 180;

export function createWorkspaceFileReferencePickerController(
  input: CreateWorkspaceFileReferencePickerControllerInput
): WorkspaceFileReferencePickerController {
  const searchDebounceMs = input.searchDebounceMs ?? defaultSearchDebounceMs;
  let browseSequence = 0;
  let previewObjectUrl: string | null = null;
  let previewSequence = 0;
  let retained = false;
  let searchAbortController: AbortController | null = null;
  let searchSequence = 0;
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  let snapshot: WorkspaceFileReferencePickerControllerSnapshot = {
    browseError: null,
    browseRootPath: null,
    directoryStateByPath: {},
    expandedFolderPaths: {},
    initialPathRevealed: false,
    isBrowseLoading: false,
    isSearchLoading: false,
    mode: "browse",
    previewState: { status: "empty" },
    searchEntries: [],
    searchError: null,
    searchQuery: ""
  };
  const store = proxy(snapshot);

  const setSnapshot = (
    update:
      | Partial<WorkspaceFileReferencePickerControllerSnapshot>
      | ((
          current: WorkspaceFileReferencePickerControllerSnapshot
        ) => WorkspaceFileReferencePickerControllerSnapshot)
  ) => {
    const next =
      typeof update === "function"
        ? update(snapshot)
        : { ...snapshot, ...update };
    if (next === snapshot) {
      return;
    }
    snapshot = next;
    Object.assign(store, next);
  };

  const loadDirectoryListing = async (path?: string | null) => {
    if (!input.fileAdapter?.listDirectory) {
      return null;
    }
    const listing = await input.fileAdapter.listDirectory({
      path: path ?? undefined,
      workspaceId: input.workspaceId
    });
    const displayPath =
      listing.directoryPath || listing.rootPath || path || defaultDirectoryPath;
    const normalizedPath = normalizeDirectoryPath(displayPath);

    return {
      displayPath,
      entries: uniqueWorkspaceFileReferences(listing.entries),
      normalizedPath
    };
  };

  const resolveMode = (query: string) =>
    query.trim().length > 0 && input.fileAdapter?.searchReferences
      ? "search"
      : "browse";

  const clearSearchTimer = () => {
    if (searchTimer === null) {
      return;
    }
    clearTimeout(searchTimer);
    searchTimer = null;
  };

  const cancelCurrentSearch = () => {
    clearSearchTimer();
    searchSequence += 1;
    searchAbortController?.abort();
    searchAbortController = null;
  };

  const cancelCurrentBrowse = () => {
    browseSequence += 1;
  };

  const cancelCurrentPreview = () => {
    previewSequence += 1;
    if (!previewObjectUrl) {
      return;
    }
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  };

  const clearSearchResults = () => {
    cancelCurrentSearch();
    setSnapshot({
      isSearchLoading: false,
      searchEntries: [],
      searchError: null
    });
  };

  const runSearch = async (query: string) => {
    if (!retained || !input.fileAdapter?.searchReferences) {
      return;
    }

    const sequence = ++searchSequence;
    searchAbortController?.abort();
    const abortController = new AbortController();
    searchAbortController = abortController;
    setSnapshot({
      isSearchLoading: true,
      searchError: null
    });

    try {
      const refs = await input.fileAdapter.searchReferences({
        query,
        signal: abortController.signal,
        workspaceId: input.workspaceId
      });
      if (!retained || sequence !== searchSequence) {
        return;
      }
      setSnapshot({
        isSearchLoading: false,
        searchEntries: uniqueWorkspaceFileReferences(refs),
        searchError: null
      });
    } catch (error) {
      if (isAbortError(error) || sequence !== searchSequence || !retained) {
        return;
      }
      setSnapshot({
        isSearchLoading: false,
        searchEntries: [],
        searchError: normalizeControllerError(
          error,
          "Workspace file reference search failed"
        )
      });
    } finally {
      if (sequence === searchSequence) {
        searchAbortController = null;
      }
    }
  };

  const scheduleSearch = () => {
    clearSearchTimer();
    const query = snapshot.searchQuery.trim();
    if (!retained || !input.fileAdapter?.searchReferences || !query) {
      clearSearchResults();
      return;
    }

    if (searchDebounceMs <= 0) {
      void runSearch(query);
      return;
    }

    searchTimer = setTimeout(() => {
      searchTimer = null;
      void runSearch(query);
    }, searchDebounceMs);
  };

  const loadBrowseRoot = async () => {
    if (
      !retained ||
      snapshot.mode !== "browse" ||
      !(
        input.fileAdapter?.listDirectory || input.fileAdapter?.loadReferenceTree
      )
    ) {
      return;
    }
    const activeBrowseRootPath = snapshot.browseRootPath;
    const normalizedRoot = activeBrowseRootPath
      ? normalizeDirectoryPath(activeBrowseRootPath)
      : null;
    if (
      normalizedRoot &&
      snapshot.directoryStateByPath[normalizedRoot]?.loaded
    ) {
      return;
    }

    const sequence = ++browseSequence;
    setSnapshot({
      browseError: null,
      isBrowseLoading: true
    });

    try {
      if (input.fileAdapter.loadReferenceTree) {
        const treeSnapshot = await input.fileAdapter.loadReferenceTree({
          path: activeBrowseRootPath ?? undefined,
          prefetchBudgetMs: 500,
          prefetchDepth: 4,
          workspaceId: input.workspaceId
        });
        if (!retained || sequence !== browseSequence) {
          return;
        }
        setSnapshot({
          browseRootPath: normalizeDirectoryPath(
            treeSnapshot.directory.directoryPath
          ),
          directoryStateByPath:
            createWorkspaceFileReferenceDirectoryStateFromSnapshot(
              treeSnapshot
            ),
          isBrowseLoading: false
        });
        return;
      }

      const listing = await loadDirectoryListing(activeBrowseRootPath);
      if (!retained || sequence !== browseSequence || !listing) {
        return;
      }
      setSnapshot((current) => ({
        ...current,
        browseRootPath: listing.normalizedPath,
        directoryStateByPath: {
          ...current.directoryStateByPath,
          [listing.normalizedPath]: {
            displayPath: listing.displayPath,
            entries: listing.entries,
            loaded: true,
            loading: false
          }
        },
        isBrowseLoading: false
      }));
    } catch (error) {
      if (!retained || sequence !== browseSequence) {
        return;
      }
      setSnapshot({
        browseError: normalizeControllerError(
          error,
          "Workspace file reference browse failed"
        ),
        isBrowseLoading: false
      });
    }
  };

  const loadFolderChildren = async (folder: WorkspaceFileReference) => {
    const folderKey = normalizeDirectoryPath(folder.path);
    if (
      !retained ||
      snapshot.directoryStateByPath[folderKey]?.loaded ||
      snapshot.directoryStateByPath[folderKey]?.loading
    ) {
      return;
    }

    const sequence = ++browseSequence;
    setSnapshot((current) => ({
      ...current,
      directoryStateByPath: {
        ...current.directoryStateByPath,
        [folderKey]: {
          displayPath: folder.path,
          entries: current.directoryStateByPath[folderKey]?.entries ?? [],
          loaded: current.directoryStateByPath[folderKey]?.loaded ?? false,
          loading: true
        }
      }
    }));

    try {
      const listing = await loadDirectoryListing(folderKey);
      if (!retained || sequence !== browseSequence || !listing) {
        return;
      }
      setSnapshot((current) => ({
        ...current,
        directoryStateByPath: {
          ...current.directoryStateByPath,
          [folderKey]: {
            displayPath: listing.displayPath,
            entries: listing.entries,
            loaded: true,
            loading: false
          }
        }
      }));
    } catch {
      if (!retained || sequence !== browseSequence) {
        return;
      }
      setSnapshot((current) => ({
        ...current,
        directoryStateByPath: {
          ...current.directoryStateByPath,
          [folderKey]: {
            displayPath:
              current.directoryStateByPath[folderKey]?.displayPath ??
              folder.path,
            entries: current.directoryStateByPath[folderKey]?.entries ?? [],
            loaded: current.directoryStateByPath[folderKey]?.loaded ?? false,
            loading: false
          }
        }
      }));
    }
  };

  const loadReferencePreview = async (
    reference: WorkspaceFileReference,
    target: WorkspaceFilePreviewActivationTarget,
    sequence: number
  ) => {
    try {
      const preview = await input.fileAdapter?.readReferencePreview?.({
        reference,
        workspaceId: input.workspaceId
      });
      if (!retained || sequence !== previewSequence) {
        return;
      }
      if (!preview) {
        setSnapshot({
          previewState: { reference, status: "unsupported" }
        });
        return;
      }

      const nextState = createReferencePreviewState(reference, target, preview);
      if (!retained || sequence !== previewSequence) {
        if (nextState.status === "image") {
          URL.revokeObjectURL(nextState.objectUrl);
        }
        return;
      }
      if (nextState.status === "image") {
        previewObjectUrl = nextState.objectUrl;
      }
      setSnapshot({
        previewState: nextState
      });
    } catch {
      if (!retained || sequence !== previewSequence) {
        return;
      }
      setSnapshot({
        previewState: { reference, status: "error" }
      });
    }
  };

  const setPreviewReference = (reference: WorkspaceFileReference | null) => {
    cancelCurrentPreview();
    if (!retained || !reference) {
      setSnapshot({
        previewState: { status: "empty" }
      });
      return;
    }

    const readiness = resolveWorkspaceFilePreviewReadiness(reference);
    if (readiness.status === "directory") {
      setSnapshot({
        previewState: { reference, status: "directory" }
      });
      return;
    }
    if (readiness.status === "unsupported") {
      setSnapshot({
        previewState: { reference, status: "unsupported" }
      });
      return;
    }
    if (readiness.status === "readonly") {
      setSnapshot({
        previewState: {
          maxSizeBytes: readiness.maxSizeBytes,
          reason: readiness.reason,
          reference,
          status: "readonly"
        }
      });
      return;
    }

    if (!input.fileAdapter?.readReferencePreview) {
      setSnapshot({
        previewState: { reference, status: "unavailable" }
      });
      return;
    }

    const sequence = ++previewSequence;
    setSnapshot({
      previewState: { reference, status: "loading" }
    });
    void loadReferencePreview(reference, readiness.target, sequence);
  };

  return {
    close() {
      retained = false;
      cancelCurrentBrowse();
      cancelCurrentPreview();
      cancelCurrentSearch();
      setSnapshot({
        isBrowseLoading: false,
        isSearchLoading: false,
        previewState: { status: "empty" }
      });
    },
    getSnapshot() {
      return snapshot;
    },
    loadBrowseRoot() {
      void loadBrowseRoot();
    },
    open() {
      if (retained) {
        return;
      }
      retained = true;
      if (snapshot.mode === "search") {
        scheduleSearch();
        return;
      }
      void loadBrowseRoot();
    },
    async revealInitialPath(initialDirectoryPath) {
      if (
        !retained ||
        snapshot.mode !== "browse" ||
        snapshot.initialPathRevealed ||
        !snapshot.browseRootPath
      ) {
        return null;
      }

      const rootPath = normalizeDirectoryPath(snapshot.browseRootPath);
      if (!isPathInsideOrEqual(initialDirectoryPath, rootPath)) {
        setSnapshot({
          initialPathRevealed: true
        });
        return null;
      }

      const sequence = ++browseSequence;
      const loadedDirectories: Record<
        string,
        WorkspaceFileReferenceDirectoryState
      > = {};
      const expandedDirectories: Record<string, boolean> = {};
      const directoryState = (path: string) =>
        loadedDirectories[path] ?? snapshot.directoryStateByPath[path];

      const directoryPaths = directoryChainBetween(
        rootPath,
        initialDirectoryPath
      );
      for (const directoryPath of directoryPaths) {
        expandedDirectories[directoryPath] = true;
      }

      const listings = await Promise.all(
        directoryPaths
          .filter((directoryPath) => !directoryState(directoryPath)?.loaded)
          .map(async (directoryPath) => {
            try {
              return await loadDirectoryListing(directoryPath);
            } catch {
              return null;
            }
          })
      );

      for (const listing of listings) {
        if (!listing) {
          continue;
        }
        loadedDirectories[listing.normalizedPath] = {
          displayPath: listing.displayPath,
          entries: listing.entries,
          loaded: true,
          loading: false
        };
      }

      if (!retained || sequence !== browseSequence) {
        return null;
      }
      setSnapshot((current) => ({
        ...current,
        directoryStateByPath: {
          ...current.directoryStateByPath,
          ...loadedDirectories
        },
        expandedFolderPaths: {
          ...current.expandedFolderPaths,
          ...expandedDirectories
        },
        initialPathRevealed: true
      }));
      return initialDirectoryPath;
    },
    reset() {
      cancelCurrentBrowse();
      cancelCurrentPreview();
      cancelCurrentSearch();
      setSnapshot({
        browseError: null,
        browseRootPath: null,
        directoryStateByPath: {},
        expandedFolderPaths: {},
        initialPathRevealed: false,
        isBrowseLoading: false,
        isSearchLoading: false,
        mode: "browse",
        previewState: { status: "empty" },
        searchEntries: [],
        searchError: null,
        searchQuery: ""
      });
    },
    setPreviewReference(reference) {
      setPreviewReference(reference);
    },
    setSearchQuery(query) {
      if (query === snapshot.searchQuery) {
        return;
      }
      const nextMode = resolveMode(query);
      setSnapshot({
        mode: nextMode,
        searchQuery: query,
        ...(nextMode === "browse" ? { isSearchLoading: false } : {})
      });
      if (nextMode === "search") {
        cancelCurrentBrowse();
        scheduleSearch();
        return;
      }
      clearSearchResults();
      void loadBrowseRoot();
    },
    get store() {
      return store;
    },
    toggleFolder(entry) {
      const folderKey = normalizeDirectoryPath(entry.path);
      const childState = snapshot.directoryStateByPath[folderKey];
      const nextExpanded = !(snapshot.expandedFolderPaths[folderKey] ?? false);

      setSnapshot((current) => ({
        ...current,
        expandedFolderPaths: {
          ...current.expandedFolderPaths,
          [folderKey]: nextExpanded
        }
      }));
      if (nextExpanded && !childState?.loaded && !childState?.loading) {
        void loadFolderChildren(entry);
      }
    }
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function normalizeControllerError(
  error: unknown,
  fallbackMessage: string
): Error {
  return error instanceof Error ? error : new Error(fallbackMessage);
}

function createReferencePreviewState(
  reference: WorkspaceFileReference,
  target: WorkspaceFilePreviewActivationTarget,
  preview: WorkspaceFileReferencePreview
): WorkspaceFileReferencePreviewState {
  const loadedState = createWorkspaceFilePreviewLoadedState({
    bytes: preview.bytes,
    contentType: preview.contentType,
    entry: reference,
    target: {
      ...target,
      fileKind: preview.kind
    }
  });

  if (loadedState.status === "image") {
    return {
      objectUrl: URL.createObjectURL(
        new Blob([loadedState.bytes], {
          type: loadedState.contentType
        })
      ),
      reference,
      status: "image"
    };
  }

  if (loadedState.status === "text") {
    return {
      content: loadedState.content,
      reference,
      status: "text"
    };
  }

  return {
    maxSizeBytes: loadedState.maxSizeBytes,
    reason: loadedState.reason,
    reference,
    status: "readonly"
  };
}

function isPathInsideOrEqual(path: string, root: string): boolean {
  const normalizedPath = normalizeDirectoryPath(path);
  const normalizedRoot = normalizeDirectoryPath(root);
  if (normalizedRoot === "/") {
    return normalizedPath.startsWith("/");
  }
  return (
    normalizedPath === normalizedRoot ||
    normalizedPath.startsWith(`${normalizedRoot}/`)
  );
}

function directoryChainBetween(root: string, target: string): string[] {
  const normalizedRoot = normalizeDirectoryPath(root);
  let current = normalizeDirectoryPath(target);
  const chain: string[] = [];

  while (current && current !== normalizedRoot) {
    chain.unshift(current);
    const parent = dirnameDirectoryPath(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return chain;
}

function dirnameDirectoryPath(path: string): string {
  const normalized = normalizeDirectoryPath(path);
  if (normalized === "/") {
    return "/";
  }
  const index = normalized.lastIndexOf("/");
  if (index <= 0) {
    return "/";
  }
  return normalized.slice(0, index);
}
