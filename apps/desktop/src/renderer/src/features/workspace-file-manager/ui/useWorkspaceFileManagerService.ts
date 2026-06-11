import { useService } from "@zk-tech/bedrock/di";
import { IWorkspaceFileManagerService } from "../services/workspaceFileManagerService.interface";

export function useWorkspaceFileManagerService() {
  return useService(IWorkspaceFileManagerService);
}
