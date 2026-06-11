import type {
  ReadWorkspaceFileInput,
  ReadWorkspaceFileResult
} from "../../../../../shared/contracts/dto";
import { getOptionalAgentHostApi } from "../../../../../agentActivityHost";

export interface WorkspaceFileReadFingerprint {
  sizeBytes?: number | null;
  mtimeMs?: number | null;
}

export interface CoalescedWorkspaceFileReadInput extends ReadWorkspaceFileInput {
  fingerprint?: WorkspaceFileReadFingerprint;
}

const inflightReads = new Map<string, Promise<ReadWorkspaceFileResult>>();

export async function readWorkspaceFile(
  input: CoalescedWorkspaceFileReadInput
): Promise<ReadWorkspaceFileResult> {
  const key = workspaceFileReadKey(input);
  let promise = inflightReads.get(key);
  if (!promise) {
    const readFile = getOptionalAgentHostApi()?.workspace?.readFile;
    if (!readFile) {
      throw new Error("Workspace file read API is unavailable");
    }
    promise = readFile({ path: input.path });
    inflightReads.set(key, promise);
    void promise.then(
      () => {
        inflightReads.delete(key);
      },
      () => {
        inflightReads.delete(key);
      }
    );
  }

  return cloneWorkspaceFileReadResult(await promise);
}

export function resetWorkspaceFileReadClientForTests(): void {
  inflightReads.clear();
}

function workspaceFileReadKey(input: CoalescedWorkspaceFileReadInput): string {
  const path = input.path.trim();
  const size = input.fingerprint?.sizeBytes ?? "";
  const mtime = input.fingerprint?.mtimeMs ?? "";
  return `${path}\x00${size}\x00${mtime}`;
}

function cloneWorkspaceFileReadResult(
  result: ReadWorkspaceFileResult
): ReadWorkspaceFileResult {
  const source =
    result.bytes instanceof Uint8Array
      ? result.bytes
      : new Uint8Array(result.bytes);
  return { bytes: new Uint8Array(source) };
}
