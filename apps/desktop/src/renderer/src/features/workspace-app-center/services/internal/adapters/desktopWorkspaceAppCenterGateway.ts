import type {
  NextopdClient,
  WorkspaceApp,
  WorkspaceAppCatalogLoadStatus,
  WorkspaceAppFactoryJob as NextopdWorkspaceAppFactoryJob,
  WorkspaceAppFactoryJobListResponse,
  WorkspaceAppFactoryJobStatus as NextopdWorkspaceAppFactoryJobStatus,
  WorkspaceAppListResponse,
  WorkspaceAppRuntimeStatus
} from "@tutti-os/client-nextopd-ts";
import type {
  WorkspaceAppFactoryJob,
  WorkspaceAppFactoryJobStatus,
  WorkspaceAppFactorySnapshot,
  WorkspaceAppCenterApp,
  WorkspaceAppCenterCatalogStatus,
  WorkspaceAppCenterGateway,
  WorkspaceAppCenterLocalization,
  WorkspaceAppCenterSource,
  WorkspaceAppCenterRuntimeStatus,
  WorkspaceAppCenterSnapshot
} from "../../workspaceAppCenterTypes";

export interface WorkspaceAppLike {
  readonly appId: string;
  readonly cli?: WorkspaceApp["cli"];
  readonly availableIconUrl?: string | null;
  readonly availableVersion?: string | null;
  readonly createdAtUnixMs?: number | null;
  readonly description: string;
  readonly displayName: string;
  readonly enabled: boolean;
  readonly exportable: boolean;
  readonly failureReason?: string | null;
  readonly iconUrl?: string | null;
  readonly installed: boolean;
  readonly lastError?: string | null;
  readonly launchUrl?: string | null;
  readonly localizations?: readonly WorkspaceAppLocalizationLike[];
  readonly minimizeBehavior?: "hibernate" | "keep-mounted";
  readonly port?: number | null;
  readonly source: WorkspaceApp["source"];
  readonly startedAtUnixMs?: number | null;
  readonly stateRevision: number;
  readonly status: WorkspaceAppRuntimeStatus;
  readonly tags?: readonly string[];
  readonly updatedAtUnixMs?: number | null;
  readonly updateAvailable?: boolean;
  readonly version: string;
  readonly windowMinHeight?: number | null;
  readonly windowMinWidth?: number | null;
}

export interface WorkspaceAppLocalizationLike {
  readonly locale: string;
  readonly displayName?: string | null;
  readonly description?: string | null;
  readonly tags?: readonly string[];
}

export function createDesktopWorkspaceAppCenterGateway(
  nextopdClient: NextopdClient
): WorkspaceAppCenterGateway {
  return {
    async installWorkspaceApp(workspaceId, appId) {
      await nextopdClient.installWorkspaceApp(workspaceId, appId);
      return normalizeWorkspaceAppCenterSnapshot(
        await nextopdClient.listWorkspaceApps(workspaceId)
      );
    },
    async deleteWorkspaceApp(workspaceId, appId) {
      await nextopdClient.deleteWorkspaceApp(workspaceId, appId);
      return normalizeWorkspaceAppCenterSnapshot(
        await nextopdClient.listWorkspaceApps(workspaceId)
      );
    },
    async exportWorkspaceApp(workspaceId, appId, input) {
      return nextopdClient.exportWorkspaceApp(workspaceId, appId, input);
    },
    async importWorkspaceApp(workspaceId, input) {
      await nextopdClient.importWorkspaceApp(workspaceId, input);
      return normalizeWorkspaceAppCenterSnapshot(
        await nextopdClient.listWorkspaceApps(workspaceId)
      );
    },
    async replaceWorkspaceAppIcon(workspaceId, appId, input) {
      return normalizeWorkspaceAppCenterApp(
        await nextopdClient.replaceWorkspaceAppIcon(workspaceId, appId, input)
      );
    },
    async listWorkspaceApps(workspaceId) {
      return normalizeWorkspaceAppCenterSnapshot(
        await nextopdClient.listWorkspaceApps(workspaceId)
      );
    },
    async refreshWorkspaceAppCatalog(workspaceId) {
      return normalizeWorkspaceAppCenterSnapshot(
        await nextopdClient.refreshWorkspaceAppCatalog(workspaceId)
      );
    },
    async uninstallWorkspaceApp(workspaceId, appId) {
      await nextopdClient.uninstallWorkspaceApp(workspaceId, appId);
      return normalizeWorkspaceAppCenterSnapshot(
        await nextopdClient.listWorkspaceApps(workspaceId)
      );
    },
    async retryWorkspaceApp(workspaceId, appId) {
      await nextopdClient.retryWorkspaceApp(workspaceId, appId);
      return normalizeWorkspaceAppCenterSnapshot(
        await nextopdClient.listWorkspaceApps(workspaceId)
      );
    },
    async rollbackWorkspaceApp(workspaceId, appId, version) {
      await nextopdClient.rollbackWorkspaceApp(workspaceId, appId, { version });
      return normalizeWorkspaceAppCenterSnapshot(
        await nextopdClient.listWorkspaceApps(workspaceId)
      );
    },
    async listWorkspaceAppFactoryJobs(workspaceId) {
      return normalizeWorkspaceAppFactorySnapshot(
        await nextopdClient.listWorkspaceAppFactoryJobs(workspaceId)
      );
    },
    async createWorkspaceAppFactoryJob(workspaceId, input) {
      await nextopdClient.createWorkspaceAppFactoryJob(workspaceId, input);
      return normalizeWorkspaceAppFactorySnapshot(
        await nextopdClient.listWorkspaceAppFactoryJobs(workspaceId)
      );
    },
    async cancelWorkspaceAppFactoryJob(workspaceId, jobId) {
      await nextopdClient.cancelWorkspaceAppFactoryJob(workspaceId, jobId);
      return normalizeWorkspaceAppFactorySnapshot(
        await nextopdClient.listWorkspaceAppFactoryJobs(workspaceId)
      );
    },
    async deleteWorkspaceAppFactoryJob(workspaceId, jobId) {
      return normalizeWorkspaceAppFactorySnapshot(
        await nextopdClient.deleteWorkspaceAppFactoryJob(workspaceId, jobId)
      );
    },
    async retryWorkspaceAppFactoryJobValidation(workspaceId, jobId) {
      await nextopdClient.retryWorkspaceAppFactoryJobValidation(
        workspaceId,
        jobId
      );
      return normalizeWorkspaceAppFactorySnapshot(
        await nextopdClient.listWorkspaceAppFactoryJobs(workspaceId)
      );
    },
    async fixWorkspaceAppFactoryJob(workspaceId, jobId, input) {
      await nextopdClient.fixWorkspaceAppFactoryJob(workspaceId, jobId, input);
      return normalizeWorkspaceAppFactorySnapshot(
        await nextopdClient.listWorkspaceAppFactoryJobs(workspaceId)
      );
    },
    async prepareWorkspaceAppFactoryJobModification(workspaceId, jobId) {
      await nextopdClient.prepareWorkspaceAppFactoryJobModification(
        workspaceId,
        jobId
      );
      return normalizeWorkspaceAppFactorySnapshot(
        await nextopdClient.listWorkspaceAppFactoryJobs(workspaceId)
      );
    },
    async publishWorkspaceAppFactoryJob(workspaceId, jobId) {
      await nextopdClient.publishWorkspaceAppFactoryJob(workspaceId, jobId);
      const [apps, jobs] = await Promise.all([
        nextopdClient.listWorkspaceApps(workspaceId),
        nextopdClient.listWorkspaceAppFactoryJobs(workspaceId)
      ]);
      return {
        appSnapshot: normalizeWorkspaceAppCenterSnapshot(apps),
        factorySnapshot: normalizeWorkspaceAppFactorySnapshot(jobs)
      };
    },
    async startEnabledWorkspaceApps(workspaceId) {
      return normalizeWorkspaceAppCenterSnapshot(
        await nextopdClient.startEnabledWorkspaceApps(workspaceId)
      );
    }
  };
}

export function normalizeWorkspaceAppFactorySnapshot(
  response: WorkspaceAppFactoryJobListResponse
): WorkspaceAppFactorySnapshot {
  return {
    jobs: response.jobs.map(normalizeWorkspaceAppFactoryJob)
  };
}

export function normalizeWorkspaceAppFactoryJob(
  job: NextopdWorkspaceAppFactoryJob
): WorkspaceAppFactoryJob {
  return {
    agentSessionId: job.agentSessionId,
    appId: job.appId,
    createdAtUnixMs: job.createdAtUnixMs,
    description: job.description,
    displayName: job.displayName,
    failureReason: job.failureReason,
    jobId: job.jobId,
    model: job.model,
    prompt: job.prompt,
    provider: job.provider,
    reasoningEffort: job.reasoningEffort,
    publishedVersion: job.publishedVersion,
    status: normalizeFactoryJobStatus(job.status),
    updatedAtUnixMs: job.updatedAtUnixMs,
    validationResult: job.validationResult,
    workspaceId: job.workspaceId
  };
}

export function normalizeWorkspaceAppCenterSnapshot(
  response: WorkspaceAppListResponse
): WorkspaceAppCenterSnapshot {
  return {
    apps: response.apps.map(normalizeWorkspaceAppCenterApp),
    catalogLastError: response.catalogStatus.lastError,
    catalogStatus: normalizeCatalogStatus(response.catalogStatus.status),
    catalogUpdatedAtUnixMs: response.catalogStatus.updatedAtUnixMs
  };
}

function normalizeCatalogStatus(
  status: WorkspaceAppCatalogLoadStatus
): WorkspaceAppCenterCatalogStatus {
  switch (status) {
    case "failed":
      return "failed";
    case "loading":
      return "loading";
    case "ready":
      return "ready";
    default:
      return "disabled";
  }
}

function normalizeFactoryJobStatus(
  status: NextopdWorkspaceAppFactoryJobStatus
): WorkspaceAppFactoryJobStatus {
  switch (status) {
    case "canceled":
      return "canceled";
    case "failed":
      return "failed";
    case "generating":
      return "generating";
    case "preparing":
      return "preparing";
    case "published":
      return "published";
    case "ready":
      return "ready";
    case "validating":
      return "validating";
    case "queued":
      return "queued";
    default:
      return assertNever(
        status,
        "Unsupported workspace app factory job status"
      );
  }
}

export function normalizeWorkspaceAppCenterApp(
  app: WorkspaceAppLike
): WorkspaceAppCenterApp {
  return {
    appId: app.appId,
    availableIconUrl: app.availableIconUrl,
    availableVersion: app.availableVersion,
    createdAtUnixMs: app.createdAtUnixMs ?? 0,
    description: app.description,
    enabled: app.enabled,
    exportable: app.exportable,
    failureReason: app.failureReason ?? null,
    iconUrl: app.iconUrl,
    installed: app.installed,
    lastError: app.lastError ?? null,
    cli: normalizeWorkspaceAppCliState(app.cli),
    localizations: (app.localizations ?? []).map(
      normalizeWorkspaceAppLocalization
    ),
    minimizeBehavior:
      app.minimizeBehavior === "hibernate" ? "hibernate" : "keep-mounted",
    name: app.displayName,
    runtimeStatus: normalizeRuntimeStatus(app.status),
    source: normalizeWorkspaceAppCenterSource(app.source),
    stateRevision: app.stateRevision,
    tags: app.tags ?? [],
    updateAvailable: app.updateAvailable ?? false,
    url: app.status === "running" ? app.launchUrl : null,
    version: app.version,
    windowMinHeight: normalizeWorkspaceAppWindowMinimum(app.windowMinHeight),
    windowMinWidth: normalizeWorkspaceAppWindowMinimum(app.windowMinWidth)
  };
}

function normalizeWorkspaceAppWindowMinimum(
  value: number | null | undefined
): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : null;
}

function normalizeWorkspaceAppCliState(
  cli: WorkspaceAppLike["cli"] | undefined
): WorkspaceAppCenterApp["cli"] {
  return {
    active: cli?.active ?? false,
    issues: (cli?.issues ?? []).map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: issue.path
    })),
    scope: cli?.scope,
    status: cli?.status ?? "none"
  };
}

function normalizeWorkspaceAppLocalization(
  localization: WorkspaceAppLocalizationLike
): WorkspaceAppCenterLocalization {
  return {
    description: localization.description,
    locale: localization.locale,
    name: localization.displayName,
    tags: localization.tags ?? []
  };
}

function normalizeWorkspaceAppCenterSource(
  source: WorkspaceAppLike["source"]
): WorkspaceAppCenterSource {
  switch (source) {
    case "builtin":
      return "builtin";
    case "generated":
      return "generated";
    case "imported":
      return "imported";
    default:
      return assertNever(source, "Unsupported workspace app source");
  }
}

function normalizeRuntimeStatus(
  status: WorkspaceAppRuntimeStatus
): WorkspaceAppCenterRuntimeStatus {
  switch (status) {
    case "running":
      return "running";
    case "preparing":
      return "preparing";
    case "starting":
      return "starting";
    case "failed":
      return "failed";
    case "stopping":
      return "stopping";
    case "idle":
      return "idle";
    default:
      return assertNever(status, "Unsupported workspace app runtime status");
  }
}

function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}
