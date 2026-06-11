import { useService } from "@zk-tech/bedrock/di";
import { useSnapshot } from "valtio";
import { IWorkspaceAppCenterService } from "../services/workspaceAppCenterService.interface";

export function useWorkspaceAppCenterService() {
  const service = useService(IWorkspaceAppCenterService);
  const state = useSnapshot(service.store);

  return {
    service,
    state
  };
}
