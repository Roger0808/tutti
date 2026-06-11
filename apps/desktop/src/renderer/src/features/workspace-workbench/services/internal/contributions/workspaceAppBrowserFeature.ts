import {
  createBrowserNodeFeature,
  type BrowserNodeEvent,
  type BrowserNodeFeature
} from "@tutti-os/browser-node";
import type { I18nRuntime } from "@tutti-os/ui-i18n-runtime";
import type { DesktopBrowserApi, DesktopRuntimeApi } from "@preload/types";
import { workspaceAppWebviewTypeID } from "../../../../workspace-app-center/services/workspaceAppCenterLaunchIds.ts";
import type { WorkspaceBrowserService } from "../workspaceBrowserService.ts";

export function createWorkspaceAppBrowserFeature(input: {
  browserApi: DesktopBrowserApi;
  browserService: WorkspaceBrowserService;
  i18n?: I18nRuntime<string>;
  runtimeApi: Pick<DesktopRuntimeApi, "logRendererDiagnostic">;
  workspaceId: string;
}): BrowserNodeFeature {
  const feature = createBrowserNodeFeature({
    hostApi: input.browserService.createFeatureHostApi({
      acceptsEvent: isWorkspaceAppBrowserEvent,
      source: "workspace_app",
      workspaceId: input.workspaceId
    }),
    i18n: input.i18n,
    reportDiagnostic: (diagnostic) => {
      void input.runtimeApi
        .logRendererDiagnostic({
          details: diagnostic.details,
          event: `browser-node.${diagnostic.event}`,
          level: diagnostic.level,
          source: "workspace-app-webview",
          workspaceId: input.workspaceId
        })
        .catch(() => undefined);
    }
  });
  input.browserService.ensureFeatureConnected(feature);
  return feature;
}

function isWorkspaceAppBrowserEvent(event: BrowserNodeEvent): boolean {
  const nodeId = event.type === "open-url" ? event.sourceNodeId : event.nodeId;
  return (
    nodeId.startsWith(`${workspaceAppWebviewTypeID}:`) ||
    nodeId.startsWith("workspace-app:")
  );
}
