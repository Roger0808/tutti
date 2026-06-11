import {
  createNextopdEventStreamClient,
  type NextopdEventStreamClient
} from "@tutti-os/client-nextopd-ts";
import type { DesktopRuntimeApi } from "@preload/types";

export function createDesktopNextopdEventStreamClient(
  runtimeApi: DesktopRuntimeApi
): NextopdEventStreamClient {
  return createNextopdEventStreamClient({
    resolveUrl: () => runtimeApi.getBusinessEventStreamUrl()
  });
}
