import type {
  WorkbenchHostNodeData,
  WorkbenchMissionControlAdapter,
  WorkbenchMissionControlMode
} from "@tutti-os/workbench-surface";
import { MissionControlActivatedReporter } from "../../../analytics/reporters/mission-control-activated/missionControlActivatedReporter.ts";
import { MissionControlDeactivatedReporter } from "../../../analytics/reporters/mission-control-deactivated/missionControlDeactivatedReporter.ts";
import type { IReporterService } from "../../../analytics/services/reporterService.interface.ts";

export type WorkspaceMissionControlTrigger = "button" | "keyboard";

export interface WorkspaceMissionControlSnapshot {
  canOpen: boolean;
  isOpen: boolean;
  mode: WorkbenchMissionControlMode | null;
  shortcutsEnabled: boolean;
  visibleWindowCount: number;
}

export interface WorkspaceMissionControlController {
  close: () => void;
  getSnapshot: () => WorkspaceMissionControlSnapshot;
  open: (
    mode: WorkbenchMissionControlMode,
    trigger?: WorkspaceMissionControlTrigger
  ) => void;
  setAdapter: (
    adapter: WorkbenchMissionControlAdapter<WorkbenchHostNodeData> | null
  ) => void;
  subscribe: (listener: () => void) => () => void;
}

export interface WorkspaceMissionControlControllerDependencies {
  reporterService?: Pick<IReporterService, "trackEvents">;
  reporterNow?: () => number;
}

export function createWorkspaceMissionControlController(
  dependencies: WorkspaceMissionControlControllerDependencies = {}
): WorkspaceMissionControlController {
  let adapter: WorkbenchMissionControlAdapter<WorkbenchHostNodeData> | null =
    null;
  let unsubscribeAdapter: (() => void) | null = null;
  let activatedAt: number | null = null;
  let snapshot = createSnapshot({ adapter, mode: null });
  const listeners = new Set<() => void>();
  const now = () => dependencies.reporterNow?.() ?? Date.now();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };
  const setMode = (mode: WorkbenchMissionControlMode | null) => {
    const nextSnapshot = createSnapshot({ adapter, mode });
    if (isEqualSnapshot(snapshot, nextSnapshot)) {
      return;
    }

    snapshot = nextSnapshot;
    notify();
  };
  const refreshSnapshot = () => {
    const nextMode =
      !adapter || adapter.getSnapshot().visibleNodes.length <= 1
        ? null
        : snapshot.mode;
    const nextSnapshot = createSnapshot({ adapter, mode: nextMode });
    if (isEqualSnapshot(snapshot, nextSnapshot)) {
      return;
    }

    snapshot = nextSnapshot;
    notify();
  };

  return {
    close: () => {
      if (snapshot.mode === null) {
        return;
      }

      const durationMs =
        activatedAt === null ? 0 : Math.max(0, now() - activatedAt);
      setMode(null);
      activatedAt = null;
      reportDeactivated(durationMs, dependencies);
    },
    getSnapshot: () => {
      return snapshot;
    },
    open: (mode, trigger = "button") => {
      if (!snapshot.canOpen || snapshot.mode === mode) {
        return;
      }

      activatedAt = now();
      setMode(mode);
      reportActivated(
        {
          mode,
          trigger,
          windowCount: snapshot.visibleWindowCount
        },
        dependencies
      );
    },
    setAdapter: (nextAdapter) => {
      unsubscribeAdapter?.();
      adapter = nextAdapter;
      unsubscribeAdapter = nextAdapter?.subscribe(refreshSnapshot) ?? null;

      if (!adapter) {
        refreshSnapshot();
        return;
      }
      refreshSnapshot();
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    }
  };
}

function reportActivated(
  params: {
    mode: WorkbenchMissionControlMode;
    trigger: WorkspaceMissionControlTrigger;
    windowCount: number;
  },
  dependencies: WorkspaceMissionControlControllerDependencies
): void {
  if (!dependencies.reporterService) {
    return;
  }

  void new MissionControlActivatedReporter(params, {
    reporterService: dependencies.reporterService,
    now: dependencies.reporterNow
  }).report();
}

function reportDeactivated(
  durationMs: number,
  dependencies: WorkspaceMissionControlControllerDependencies
): void {
  if (!dependencies.reporterService) {
    return;
  }

  void new MissionControlDeactivatedReporter(
    {
      durationMs
    },
    {
      reporterService: dependencies.reporterService,
      now: dependencies.reporterNow
    }
  ).report();
}

function createSnapshot({
  adapter,
  mode
}: {
  adapter: WorkbenchMissionControlAdapter<WorkbenchHostNodeData> | null;
  mode: WorkbenchMissionControlMode | null;
}): WorkspaceMissionControlSnapshot {
  const visibleWindowCount = adapter?.getSnapshot().visibleNodes.length ?? 0;
  const canOpen = visibleWindowCount > 1;
  return {
    canOpen,
    isOpen: mode !== null,
    mode,
    shortcutsEnabled: mode === null,
    visibleWindowCount
  };
}

function isEqualSnapshot(
  left: WorkspaceMissionControlSnapshot,
  right: WorkspaceMissionControlSnapshot
): boolean {
  return (
    left.canOpen === right.canOpen &&
    left.isOpen === right.isOpen &&
    left.mode === right.mode &&
    left.shortcutsEnabled === right.shortcutsEnabled &&
    left.visibleWindowCount === right.visibleWindowCount
  );
}
