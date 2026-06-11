import type { DesktopWorkbenchContributionFactory } from "../workspaceWorkbenchContributionFactory";
import { createWorkspaceBrowserContribution } from "../workspaceBrowserContribution.ts";

export const browserWorkbenchContributionFactory: DesktopWorkbenchContributionFactory =
  {
    id: "workspace-browser",
    order: 20,
    create(context) {
      return context.browserApi
        ? createWorkspaceBrowserContribution({
            browserApi: context.browserApi,
            browserService: context.browserService,
            dockIconUrl: context.dockIcons.browser,
            i18n: context.appI18n,
            runtimeApi: context.runtimeApi,
            reporterService: context.reporterService,
            workspaceId: context.workspaceId
          })
        : null;
    }
  };
