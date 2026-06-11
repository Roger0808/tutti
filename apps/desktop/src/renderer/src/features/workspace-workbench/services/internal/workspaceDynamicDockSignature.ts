export function createWorkspaceDynamicDockSignature(input: {
  agentProviderRevision: number;
  apps: readonly {
    appId: string;
    enabled: boolean;
    iconUrl?: string | null;
    installed: boolean;
    name: string;
    runtimeStatus: string;
    url?: string | null;
  }[];
}): string {
  return JSON.stringify({
    agentProviderRevision: input.agentProviderRevision,
    apps: input.apps.map((app) => ({
      appId: app.appId,
      enabled: app.enabled,
      iconUrl: app.iconUrl ?? null,
      installed: app.installed,
      name: app.name,
      runtimeStatus: app.runtimeStatus,
      url: app.url ?? null
    }))
  });
}
