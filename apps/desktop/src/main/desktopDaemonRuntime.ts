import {
  createNextopdClient,
  type NextopdClient
} from "@tutti-os/client-nextopd-ts";
import {
  createNextopdManager,
  type NextopdManager
} from "./daemon/nextopdManager";
import { createDesktopDaemonFetch } from "./transport/fetch";
import {
  resolveDesktopDaemonEndpoint,
  type DesktopDaemonEndpoint
} from "./transport/paths";

export interface DesktopDaemonRuntime {
  daemonEndpoint: DesktopDaemonEndpoint;
  nextopd: NextopdManager;
  nextopdClient: NextopdClient;
}

export function createDesktopDaemonRuntime(): DesktopDaemonRuntime {
  const daemonEndpoint = resolveDesktopDaemonEndpoint();
  const nextopdClient = createNextopdClient({
    auth: daemonEndpoint.accessToken,
    fetch: createDesktopDaemonFetch(() => daemonEndpoint)
  });
  const nextopd = createNextopdManager(daemonEndpoint, nextopdClient);

  return {
    daemonEndpoint,
    nextopd,
    nextopdClient
  };
}
