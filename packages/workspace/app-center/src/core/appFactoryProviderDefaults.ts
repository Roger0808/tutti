export interface AppFactoryProviderDefaultOption {
  readonly disabled?: boolean;
  readonly provider: string;
}

export const DEFAULT_APP_FACTORY_PROVIDER = "codex";

export function resolveDefaultAppFactoryProvider(
  options: readonly AppFactoryProviderDefaultOption[],
  preferredProvider?: string | null
): string {
  const normalizedPreferredProvider = preferredProvider?.trim() ?? "";
  return (
    options.find(
      (option) =>
        normalizedPreferredProvider !== "" &&
        option.disabled !== true &&
        option.provider === normalizedPreferredProvider
    )?.provider ??
    options.find(
      (option) =>
        option.disabled !== true &&
        option.provider === DEFAULT_APP_FACTORY_PROVIDER
    )?.provider ??
    options.find((option) => option.disabled !== true)?.provider ??
    options.find((option) => option.provider === DEFAULT_APP_FACTORY_PROVIDER)
      ?.provider ??
    options[0]?.provider ??
    ""
  );
}

export function resolveSelectedAppFactoryProvider(
  currentProvider: string,
  options: readonly AppFactoryProviderDefaultOption[],
  preferredProvider?: string | null
): string {
  return options.some((option) => option.provider === currentProvider)
    ? currentProvider
    : resolveDefaultAppFactoryProvider(options, preferredProvider);
}
