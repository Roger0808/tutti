import { useId } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CloseIcon,
  cn
} from "@tutti-os/ui-system";
import type {
  WorkspaceFileReferenceAdapter,
  WorkspaceFileReference,
  WorkspaceFileReferenceCopy
} from "../../../contracts/index.ts";
import { useWorkspaceFileReferencePickerView } from "../../../react/index.ts";
import {
  WorkspaceFileReferencePickerFooter,
  WorkspaceFileReferencePickerPreviewPane
} from "./WorkspaceFileReferencePickerSections.tsx";
import { WorkspaceFileReferencePickerBrowserPane } from "./WorkspaceFileReferencePickerTree.tsx";

export interface WorkspaceFileReferencePickerProps {
  copy: WorkspaceFileReferenceCopy;
  fileAdapter?: WorkspaceFileReferenceAdapter;
  initialPath?: string | null;
  onClose: () => void;
  onConfirm: (refs: WorkspaceFileReference[]) => void;
  open: boolean;
  workspaceId: string;
}

const workspaceFileReferencePickerBackdropMotionClassName =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-[180ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none";

const workspaceFileReferencePickerPanelMotionClassName =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-[0.96] motion-safe:duration-[250ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none";

export function WorkspaceFileReferencePicker({
  copy,
  fileAdapter,
  initialPath,
  onClose,
  onConfirm,
  open,
  workspaceId
}: WorkspaceFileReferencePickerProps) {
  const titleId = useId();
  const {
    browseRootEntries,
    directoryStateByPath,
    expandedFolderPaths,
    focusedEntry,
    focusedPath,
    isLoading,
    mode,
    previewState,
    searchQuery,
    selectedRefs,
    visibleEntries,
    setFocusedPath,
    setSearchQuery,
    toggleFolder,
    toggleRef
  } = useWorkspaceFileReferencePickerView({
    fileAdapter,
    initialPath,
    onClose,
    onConfirm,
    open,
    workspaceId
  });

  if (!open) {
    return null;
  }

  const dialog = (
    <div
      className={cn(
        "nodrag fixed inset-0 grid place-items-center bg-[var(--backdrop)] px-3 py-4 backdrop-blur-md [-webkit-app-region:no-drag] sm:px-6 sm:py-8",
        workspaceFileReferencePickerBackdropMotionClassName
      )}
      style={{ zIndex: "var(--z-panel)" }}
      onClick={onClose}
    >
      <Card
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          "nodrag flex h-[min(88vh,44rem)] w-full max-w-5xl origin-center flex-col gap-0 overflow-hidden border-[var(--line-1)] bg-[var(--background-fronted)] py-0 text-[var(--text-primary)] shadow-panel [-webkit-app-region:no-drag] sm:h-[min(82vh,44rem)]",
          workspaceFileReferencePickerPanelMotionClassName
        )}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader
          className="border-b px-4 py-4 sm:px-6 sm:py-5"
          style={{ borderBottomColor: "var(--line-1)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle id={titleId}>
                {copy.t("referencePicker.title")}
              </CardTitle>
            </div>
            <Button
              aria-label={copy.t("actions.cancel")}
              size="icon-sm"
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              <CloseIcon size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:grid-rows-1">
          <WorkspaceFileReferencePickerBrowserPane
            browseRootEntries={browseRootEntries}
            copy={copy}
            directoryStateByPath={directoryStateByPath}
            expandedFolderPaths={expandedFolderPaths}
            focusedPath={focusedPath}
            isLoading={isLoading}
            mode={mode}
            searchQuery={searchQuery}
            selectedRefs={selectedRefs}
            setSearchQuery={setSearchQuery}
            visibleEntries={visibleEntries}
            onFocusPath={setFocusedPath}
            onToggleFolder={toggleFolder}
            onToggleRef={toggleRef}
          />
          <WorkspaceFileReferencePickerPreviewPane
            copy={copy}
            focusedEntry={focusedEntry}
            mode={mode}
            previewState={previewState}
          />
        </CardContent>
        <WorkspaceFileReferencePickerFooter
          copy={copy}
          onClose={onClose}
          onConfirm={() => onConfirm(selectedRefs)}
          selectedRefs={selectedRefs}
        />
      </Card>
    </div>
  );

  if (typeof document === "undefined") {
    return dialog;
  }
  return createPortal(dialog, document.body);
}
