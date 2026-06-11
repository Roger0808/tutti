import { useService } from "@zk-tech/bedrock/di";
import { useSnapshot } from "valtio";
import { IDesktopPreferencesService } from "../services/desktopPreferencesService.interface.ts";

export function useDesktopPreferencesService() {
  const service = useService(IDesktopPreferencesService);
  const state = useSnapshot(service.store);

  return {
    service,
    state
  };
}
