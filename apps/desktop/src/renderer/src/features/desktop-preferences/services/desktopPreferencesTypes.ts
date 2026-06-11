import type { DesktopLocale } from "@shared/i18n";
import type {
  DesktopAgentComposerDefaultsByProvider,
  DesktopAgentProvider,
  DesktopDockIconStyle,
  DesktopDockPlacement,
  DesktopSleepPreventionMode
} from "@shared/preferences";
import type { DesktopThemeSource, DesktopThemeState } from "@shared/theme";

export interface DesktopPreferencesStoreState {
  changingDefaultAgentProvider: DesktopAgentProvider | null;
  changingDockIconStyle: DesktopDockIconStyle | null;
  changingDockPlacement: DesktopDockPlacement | null;
  changingLocale: DesktopLocale | null;
  changingSleepPreventionMode: DesktopSleepPreventionMode | null;
  changingThemeSource: DesktopThemeSource | null;
  agentComposerDefaultsByProvider: DesktopAgentComposerDefaultsByProvider;
  defaultAgentProvider: DesktopAgentProvider;
  dockIconStyle: DesktopDockIconStyle;
  dockPlacement: DesktopDockPlacement;
  locale: DesktopLocale;
  sleepPreventionMode: DesktopSleepPreventionMode;
  theme: DesktopThemeState;
}

export interface DesktopPreferencesReadableStoreState {
  readonly changingDefaultAgentProvider: DesktopAgentProvider | null;
  readonly changingDockIconStyle: DesktopDockIconStyle | null;
  readonly changingDockPlacement: DesktopDockPlacement | null;
  readonly changingLocale: DesktopLocale | null;
  readonly changingSleepPreventionMode: DesktopSleepPreventionMode | null;
  readonly changingThemeSource: DesktopThemeSource | null;
  readonly agentComposerDefaultsByProvider: DesktopAgentComposerDefaultsByProvider;
  readonly defaultAgentProvider: DesktopAgentProvider;
  readonly dockIconStyle: DesktopDockIconStyle;
  readonly dockPlacement: DesktopDockPlacement;
  readonly locale: DesktopLocale;
  readonly sleepPreventionMode: DesktopSleepPreventionMode;
  readonly theme: DesktopThemeState;
}
