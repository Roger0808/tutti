import {
  resolveWorkspaceFileLinkAction,
  type OpenWorkspaceFileLinkAction,
  type WorkspaceFileLinkDirectoryListing,
  type WorkspaceLinkActionSource
} from "./workspaceLinkActions";

export type WorkspaceFileRevealFailureReason =
  | "missing"
  | "invalid"
  | "list-failed";

export type WorkspaceFileRevealResult =
  | { ok: true; action: OpenWorkspaceFileLinkAction }
  | { ok: false; reason: WorkspaceFileRevealFailureReason };

export interface WorkspaceFileRevealCommandInput {
  path: string;
  source: WorkspaceLinkActionSource;
  validateExists?: boolean;
}

export interface WorkspaceFileRevealCommandDependencies {
  workspaceRoot: string;
  listDirectory: (path: string) => Promise<WorkspaceFileLinkDirectoryListing>;
  openWorkspaceFile: (action: OpenWorkspaceFileLinkAction) => void;
}

export async function revealWorkspaceFilePath(
  input: WorkspaceFileRevealCommandInput,
  dependencies: WorkspaceFileRevealCommandDependencies
): Promise<WorkspaceFileRevealResult> {
  const action = resolveWorkspaceFileLinkAction({
    path: input.path,
    workspaceRoot: dependencies.workspaceRoot,
    source: input.source
  });

  if (!action) {
    return { ok: false, reason: "invalid" };
  }

  if (input.validateExists !== false) {
    const exists = await workspaceFileRevealTargetExists(
      action,
      dependencies.listDirectory
    );
    if (!exists.ok) {
      return exists;
    }
    action.prefetchedDirectoryListing = exists.listing;
  }

  dependencies.openWorkspaceFile(action);
  return { ok: true, action };
}

async function workspaceFileRevealTargetExists(
  action: OpenWorkspaceFileLinkAction,
  listDirectory: WorkspaceFileRevealCommandDependencies["listDirectory"]
): Promise<
  | { ok: true; listing: WorkspaceFileLinkDirectoryListing }
  | { ok: false; reason: "missing" | "list-failed" }
> {
  let listing: WorkspaceFileLinkDirectoryListing;
  try {
    listing = await listDirectory(action.directoryPath);
  } catch {
    return { ok: false, reason: "list-failed" };
  }

  const targetPath = normalizeComparablePath(action.path);
  if (
    normalizeComparablePath(listing.directoryPath) === targetPath ||
    normalizeComparablePath(listing.root) === targetPath
  ) {
    return { ok: true, listing };
  }

  return listing.entries.some(
    (entry) => normalizeComparablePath(entry.path) === targetPath
  )
    ? { ok: true, listing }
    : { ok: false, reason: "missing" };
}

function normalizeComparablePath(path: string): string {
  const normalized = path.trim().replace(/\\/g, "/").replace(/\/+/g, "/");
  if (!normalized) {
    return "/";
  }
  return normalized.startsWith("/")
    ? normalized.replace(/\/$/, "") || "/"
    : `/${normalized}`;
}
