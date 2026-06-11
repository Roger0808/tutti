const WORKSPACE_FILE_DROP_MIME_TYPE =
  "application/x-tsh-workspace-file-paths+json";

export type WorkspaceFileDropEntryKind = "file" | "directory" | "unknown";

export interface WorkspaceFileDropEntry {
  path: string;
  name: string;
  kind: WorkspaceFileDropEntryKind;
}

interface WorkspaceFileDropPayload {
  entries?: unknown;
  paths?: unknown;
}

function normalizeWorkspaceFileDropEntryKind(
  kind: unknown
): WorkspaceFileDropEntryKind {
  return kind === "file" || kind === "directory" ? kind : "unknown";
}

function basenameWorkspacePath(path: string): string {
  const normalized = path.trim().replace(/\\/g, "/").replace(/\/+$/g, "");
  const segments = normalized.split("/").filter(Boolean);
  return segments.at(-1) ?? normalized;
}

function normalizeWorkspaceFileDropEntries(
  entries: readonly WorkspaceFileDropEntry[]
): WorkspaceFileDropEntry[] {
  const uniquePaths = new Set<string>();
  const normalizedEntries: WorkspaceFileDropEntry[] = [];
  for (const entry of entries) {
    const path = entry.path.trim();
    if (!path || uniquePaths.has(path)) {
      continue;
    }
    uniquePaths.add(path);
    normalizedEntries.push({
      path,
      name: entry.name.trim() || basenameWorkspacePath(path),
      kind: normalizeWorkspaceFileDropEntryKind(entry.kind)
    });
  }
  return normalizedEntries;
}

function normalizeWorkspaceFileDropPaths(paths: readonly string[]): string[] {
  return normalizeWorkspaceFileDropEntries(
    paths.map((path) => ({
      path,
      name: basenameWorkspacePath(path),
      kind: "unknown"
    }))
  ).map((entry) => entry.path);
}

export function writeWorkspaceFileDropData(
  dataTransfer: DataTransfer,
  entriesOrPaths: readonly WorkspaceFileDropEntry[] | readonly string[]
): void {
  if (entriesOrPaths.length === 0) {
    return;
  }
  const firstItem = entriesOrPaths[0];
  const writeStructuredEntries = typeof firstItem !== "string";
  const normalizedEntries = writeStructuredEntries
    ? normalizeWorkspaceFileDropEntries(
        entriesOrPaths as readonly WorkspaceFileDropEntry[]
      )
    : [];
  const normalizedPaths = writeStructuredEntries
    ? normalizedEntries.map((entry) => entry.path)
    : normalizeWorkspaceFileDropPaths(entriesOrPaths as readonly string[]);
  if (normalizedPaths.length === 0) {
    return;
  }
  dataTransfer.effectAllowed = "copy";
  dataTransfer.setData(
    WORKSPACE_FILE_DROP_MIME_TYPE,
    JSON.stringify(
      writeStructuredEntries
        ? { entries: normalizedEntries }
        : { paths: normalizedPaths }
    )
  );
  dataTransfer.setData("text/plain", normalizedPaths.join("\n"));
}

export function hasWorkspaceFileDropData(
  dataTransfer: DataTransfer | null | undefined
): boolean {
  if (!dataTransfer) {
    return false;
  }
  return Array.from(dataTransfer.types ?? []).includes(
    WORKSPACE_FILE_DROP_MIME_TYPE
  );
}

export function readWorkspaceFileDropPaths(
  dataTransfer: DataTransfer | null | undefined
): string[] {
  return readWorkspaceFileDropEntries(dataTransfer).map((entry) => entry.path);
}

export function readWorkspaceFileDropEntries(
  dataTransfer: DataTransfer | null | undefined,
  options: { includeLegacyPaths?: boolean } = {}
): WorkspaceFileDropEntry[] {
  if (!hasWorkspaceFileDropData(dataTransfer)) {
    return [];
  }
  const raw = dataTransfer?.getData(WORKSPACE_FILE_DROP_MIME_TYPE).trim() ?? "";
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as WorkspaceFileDropPayload;
    if (Array.isArray(parsed.entries)) {
      return normalizeWorkspaceFileDropEntries(
        parsed.entries.flatMap((entry) => {
          if (!entry || typeof entry !== "object") {
            return [];
          }
          const path =
            "path" in entry && typeof entry.path === "string" ? entry.path : "";
          const name =
            "name" in entry && typeof entry.name === "string" ? entry.name : "";
          const kind = "kind" in entry ? entry.kind : "unknown";
          return [
            { path, name, kind: normalizeWorkspaceFileDropEntryKind(kind) }
          ];
        })
      );
    }
    if (options.includeLegacyPaths === false || !Array.isArray(parsed.paths)) {
      return [];
    }
    return normalizeWorkspaceFileDropEntries(
      parsed.paths
        .filter((value): value is string => typeof value === "string")
        .map((path) => ({
          path,
          name: basenameWorkspacePath(path),
          kind: "unknown"
        }))
    );
  } catch {
    return [];
  }
}

export function quoteWorkspacePathForTerminal(path: string): string {
  return `'${path.replace(/'/g, `'"'"'`)}'`;
}

export function buildWorkspaceFileDropTerminalInput(
  paths: readonly string[]
): string {
  const normalizedPaths = normalizeWorkspaceFileDropPaths(paths);
  if (normalizedPaths.length === 0) {
    return "";
  }
  return `${normalizedPaths.map((path) => quoteWorkspacePathForTerminal(path)).join(" ")} `;
}
