import { workspaceWorkbenchDesktopI18nKeys } from "@shared/i18n";
import type { DesktopWorkbenchContributionFactory } from "../workspaceWorkbenchContributionFactory";
import { createWorkspaceFilesContribution } from "../workspaceFilesContribution.ts";

export const filesWorkbenchContributionFactory: DesktopWorkbenchContributionFactory =
  {
    id: "workspace-files",
    order: 10,
    create(context) {
      const filesLabel = context.i18n.t(
        workspaceWorkbenchDesktopI18nKeys.nodes.files
      );

      return createWorkspaceFilesContribution({
        filesLabel,
        icon: context.dockIcons.files,
        renderFilesNodeBody: context.renderFilesNodeBody,
        reporterService: context.reporterService,
        workspaceFileManagerService: context.workspaceFileManagerService,
        workspaceId: context.workspaceId
      });
    }
  };
