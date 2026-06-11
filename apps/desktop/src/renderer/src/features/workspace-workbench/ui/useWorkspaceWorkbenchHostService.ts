import { useService } from "@zk-tech/bedrock/di";
import { IWorkspaceWorkbenchHostService } from "../services/workspaceWorkbenchHostService.interface";

export function useWorkspaceWorkbenchHostService() {
  return useService(IWorkspaceWorkbenchHostService);
}
