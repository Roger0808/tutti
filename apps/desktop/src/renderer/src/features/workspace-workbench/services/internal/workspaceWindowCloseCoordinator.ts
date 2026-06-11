import type {
  WorkbenchHostCloseDialogRequest,
  WorkbenchHostHandle
} from "@tutti-os/workbench-surface";
import type { WorkspaceWorkbenchHostInput } from "../workspaceWorkbenchHostService.interface";
import type { WindowCloseRequestTracker } from "../windowCloseRequestTracker";

export async function confirmWorkspaceWindowClose(input: {
  confirmCloseGuard(request: WorkbenchHostCloseDialogRequest): Promise<boolean>;
  host: WorkbenchHostHandle | null;
  hostInput: Pick<
    WorkspaceWorkbenchHostInput,
    "createWindowCloseDialogRequest" | "workspaceId"
  >;
  requestApprovedClose(): Promise<void>;
  tracker: WindowCloseRequestTracker;
}): Promise<void> {
  const host = input.host;
  if (host) {
    const effects = await host.collectWindowCloseEffects();
    const request =
      input.hostInput.createWindowCloseDialogRequest?.(effects) ?? null;
    if (request && !(await input.confirmCloseGuard(request))) {
      return;
    }
  }

  await requestWorkspaceWindowClose({
    requestApprovedClose: () => input.requestApprovedClose(),
    tracker: input.tracker
  });
}

async function requestWorkspaceWindowClose(input: {
  requestApprovedClose(): Promise<void>;
  tracker: WindowCloseRequestTracker;
}): Promise<void> {
  if (input.tracker.isClosing) {
    return;
  }

  input.tracker.begin();
  try {
    await input.requestApprovedClose();
  } finally {
    input.tracker.finish();
  }
}
