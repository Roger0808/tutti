import type { ServiceRegistry } from "@zk-tech/bedrock/di";
import type { NextopdClient } from "@tutti-os/client-nextopd-ts";
import { DesktopRichTextAtService } from "./internal/desktopRichTextAtService";
import { IDesktopRichTextAtService } from "./richTextAtService.interface";

export interface RichTextAtServiceRegistrationInput {
  nextopdClient: NextopdClient;
}

export function registerRichTextAtServices(
  registry: ServiceRegistry,
  input: RichTextAtServiceRegistrationInput
): IDesktopRichTextAtService {
  const service = new DesktopRichTextAtService({
    nextopdClient: input.nextopdClient
  });
  registry.registerInstance(IDesktopRichTextAtService, service);
  return service;
}
