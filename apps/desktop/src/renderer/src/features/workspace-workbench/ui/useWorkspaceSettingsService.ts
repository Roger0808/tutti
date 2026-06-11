import { useService } from "@zk-tech/bedrock/di";
import { useSnapshot } from "valtio";
import { IWorkspaceSettingsService } from "../services/workspaceSettingsService.interface";

export function useWorkspaceSettingsService() {
  const service = useService(IWorkspaceSettingsService);
  const state = useSnapshot(service.store);

  return {
    service,
    state
  };
}
