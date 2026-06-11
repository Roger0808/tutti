import type { ServiceRegistry } from "@zk-tech/bedrock/di";
import type {
  NextopdClient,
  NextopdEventStreamClient
} from "@tutti-os/client-nextopd-ts";
import { applyLocale, getActiveLocale } from "@renderer/i18n";
import {
  applyTheme,
  getActiveTheme,
  resolveDesktopThemeState
} from "@renderer/theme/runtime";
import { readInitialDockPlacementFromLocation } from "@shared/preferences";
import { IDesktopPreferencesService } from "./desktopPreferencesService.interface.ts";
import { createDesktopPreferencesClient } from "./internal/adapters/desktopPreferencesClient.ts";
import { DesktopPreferencesService } from "./internal/desktopPreferencesService.ts";

export function registerDesktopPreferencesServices(
  registry: ServiceRegistry,
  nextopdClient: NextopdClient,
  eventStreamClient: NextopdEventStreamClient
): IDesktopPreferencesService {
  const service = new DesktopPreferencesService({
    applyLocale,
    applyTheme,
    client: createDesktopPreferencesClient(nextopdClient, eventStreamClient),
    initialDockPlacement: readInitialDockPlacementFromLocation(),
    initialLocale: getActiveLocale(),
    initialTheme: getActiveTheme(),
    resolveTheme: resolveDesktopThemeState
  });
  registry.registerInstance(IDesktopPreferencesService, service);
  return service;
}
