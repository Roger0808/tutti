import { useEffect } from "react";
import {
  Button,
  DownloadIcon,
  LaunchIcon,
  LoadingIcon
} from "@tutti-os/ui-system";
import { useTranslation } from "@renderer/i18n";
import { cn } from "@renderer/lib/format";
import { useAppUpdateService } from "./useAppUpdateService";

export function AppUpdateStatus({
  density = "default"
}: {
  density?: "compact" | "default";
}) {
  const { t } = useTranslation();
  const { service, state } = useAppUpdateService();

  useEffect(() => {
    void service.load();
  }, [service]);

  const view = state.view;

  if (!view.visible || !view.titleKey) {
    return null;
  }

  const label = t(view.titleKey, view.titleParams);
  const compact = density === "compact";
  const isError = view.tone === "error";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between rounded-lg border",
        compact
          ? "max-w-[min(13rem,34vw)] gap-2 px-2.5 py-1.5 text-[11px]"
          : "gap-3 px-4 py-3 text-[13px]",
        isError
          ? "border-[var(--state-danger)] bg-[var(--on-danger)] text-[var(--state-danger)]"
          : "border-border/70 bg-[var(--background-fronted)] text-foreground"
      )}
    >
      <div className="flex min-w-0 items-center">
        <div className="min-w-0">
          <p className="truncate font-medium">{label}</p>
          {view.progressPercent !== null ? (
            <div
              className={cn(
                "max-w-full overflow-hidden rounded-full bg-background",
                compact ? "mt-1 h-1 w-28" : "mt-2 h-1.5 w-52"
              )}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{
                  width: `${view.progressPercent}%`
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {view.action && view.actionKey ? (
        <Button
          disabled={view.busy}
          onClick={() => {
            void service.runPrimaryAction();
          }}
          size={compact ? "xs" : "sm"}
          variant="secondary"
        >
          {state.isActing ? (
            <LoadingIcon className="size-4 animate-spin" />
          ) : view.action === "download" ? (
            <DownloadIcon className="size-4" />
          ) : (
            <LaunchIcon className="size-4" />
          )}
          {t(view.actionKey)}
        </Button>
      ) : null}
    </div>
  );
}
