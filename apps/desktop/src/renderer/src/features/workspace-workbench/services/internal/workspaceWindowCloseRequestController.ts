import type {
  WorkbenchHostCloseDialogRequest,
  WorkbenchHostHandle
} from "@tutti-os/workbench-surface";
import type {
  IWorkspaceWorkbenchHostService,
  WorkspaceWorkbenchHostInput
} from "../workspaceWorkbenchHostService.interface";

type ConfirmCloseGuard = (
  request: WorkbenchHostCloseDialogRequest
) => Promise<boolean>;

type RequestWindowClose = IWorkspaceWorkbenchHostService["requestWindowClose"];

export interface WorkspaceWindowCloseRequestController {
  requestClose: () => Promise<void>;
  setHost: (host: WorkbenchHostHandle | null) => void;
  update: (input: WorkspaceWindowCloseRequestControllerInput) => void;
}

export interface WorkspaceWindowCloseRequestControllerInput {
  confirmCloseGuard: ConfirmCloseGuard;
  hostInput: WorkspaceWorkbenchHostInput;
  requestWindowClose: RequestWindowClose;
}

export function createWorkspaceWindowCloseRequestController(
  input: WorkspaceWindowCloseRequestControllerInput
): WorkspaceWindowCloseRequestController {
  let confirmCloseGuard = input.confirmCloseGuard;
  let host: WorkbenchHostHandle | null = null;
  let hostInput = input.hostInput;
  let requestWindowClose = input.requestWindowClose;

  return {
    requestClose: () =>
      requestWindowClose({
        confirmCloseGuard,
        host,
        hostInput
      }),
    setHost: (nextHost) => {
      host = nextHost;
    },
    update: (nextInput) => {
      confirmCloseGuard = nextInput.confirmCloseGuard;
      hostInput = nextInput.hostInput;
      requestWindowClose = nextInput.requestWindowClose;
    }
  };
}
