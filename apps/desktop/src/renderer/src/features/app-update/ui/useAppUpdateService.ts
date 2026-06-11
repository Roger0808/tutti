import { useService } from "@zk-tech/bedrock/di";
import { useSnapshot } from "valtio";
import { IAppUpdateService } from "../services/appUpdateService.interface";

export function useAppUpdateService() {
  const service = useService(IAppUpdateService);
  const state = useSnapshot(service.store);

  return {
    service,
    state
  };
}
