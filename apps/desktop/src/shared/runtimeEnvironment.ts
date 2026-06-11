export interface DesktopRuntimeEnvironmentInput {
  nextopEnv?: string | null;
  nodeEnv?: string | null;
}

export function isDesktopDevelopmentRuntime({
  nextopEnv,
  nodeEnv
}: DesktopRuntimeEnvironmentInput): boolean {
  const normalizedNextopEnv = nextopEnv?.trim();
  if (normalizedNextopEnv) {
    return /^(dev|development|local)$/i.test(normalizedNextopEnv);
  }

  return nodeEnv === "development";
}
