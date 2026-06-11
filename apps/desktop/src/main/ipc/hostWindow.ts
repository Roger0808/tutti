import { desktopIpcChannels } from "../../shared/contracts/ipc";
import { createDesktopWindowAccess } from "../host/desktopWindowAccess";
import { registerDesktopIpcHandler } from "./handle";
import { resolveOwnerWindowFromEvent } from "./ownerWindow";

export function registerHostWindowIpc(): void {
  const windowAccess = createDesktopWindowAccess();

  registerDesktopIpcHandler(
    desktopIpcChannels.host.window.approveClose,
    (event) => windowAccess.approveClose(resolveOwnerWindowFromEvent(event))
  );
}
