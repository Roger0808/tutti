import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent
} from "react";
import { ChevronRight } from "lucide-react";
import {
  AgentMessageMarkdown,
  type AgentMessageMarkdownWorkspaceAppIcon
} from "../../shared/AgentMessageMarkdown";
import type { AgentGUIQueuedPromptVM } from "./model/agentGuiNodeTypes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../../app/renderer/components/ui/dropdown-menu";
import { CanvasNodeGhostIconButton } from "../shared/CanvasNodeGhostIconButton";
import {
  CanvasNodeGuideLinedIcon,
  CanvasNodeMoreLinedIcon,
  CanvasNodeTrashLinedIcon
} from "../shared/canvasNodeChromeIcons";
import styles from "./AgentGUINode.styles";

const EMPTY_WORKSPACE_APP_ICONS: readonly AgentMessageMarkdownWorkspaceAppIcon[] =
  [];

interface AgentQueuedPromptPanelProps {
  queuedPrompts: readonly AgentGUIQueuedPromptVM[];
  drainingQueuedPromptId: string | null;
  labels: {
    queuedLabel: string;
    sendQueuedPromptNext: string;
    editQueuedPrompt: string;
    deleteQueuedPrompt: string;
    queuedPromptMoreActions: string;
  };
  onSendQueuedPromptNext: (queuedPromptId: string) => void;
  onRemoveQueuedPrompt: (queuedPromptId: string) => void;
  onEditQueuedPrompt: (queuedPromptId: string) => void;
  onLinkClick?: (href: string) => void;
  workspaceAppIcons?: readonly AgentMessageMarkdownWorkspaceAppIcon[];
}

export function AgentQueuedPromptPanel({
  queuedPrompts,
  drainingQueuedPromptId,
  labels,
  onSendQueuedPromptNext,
  onRemoveQueuedPrompt,
  onEditQueuedPrompt,
  onLinkClick,
  workspaceAppIcons = EMPTY_WORKSPACE_APP_ICONS
}: AgentQueuedPromptPanelProps): React.JSX.Element {
  "use memo";
  const [isExpanded, setIsExpanded] = useState(false);
  const singlePromptTextRef = useRef<HTMLDivElement | null>(null);
  const queuedPromptListRef = useRef<HTMLDivElement | null>(null);
  const pointerHandledEditPromptIdRef = useRef<string | null>(null);
  const [isSinglePromptOverflowing, setIsSinglePromptOverflowing] =
    useState(false);
  const [expandedListMaxHeightPx, setExpandedListMaxHeightPx] = useState(280);
  const canExpand = queuedPrompts.length > 1 || isSinglePromptOverflowing;
  const panelStyle = {
    "--agent-gui-queued-prompt-expanded-height": `${expandedListMaxHeightPx}px`
  } as CSSProperties &
    Record<"--agent-gui-queued-prompt-expanded-height", string>;
  const toggleExpanded = (): void => {
    if (!canExpand) {
      return;
    }
    setIsExpanded((current) => !current);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!canExpand) {
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    toggleExpanded();
  };
  const editQueuedPrompt = (queuedPromptId: string): void => {
    pointerHandledEditPromptIdRef.current = null;
    onEditQueuedPrompt(queuedPromptId);
  };
  const handleEditQueuedPromptPointerDown = (
    event: PointerEvent,
    queuedPromptId: string
  ): void => {
    if (event.button !== 0 || event.ctrlKey) {
      return;
    }
    pointerHandledEditPromptIdRef.current = queuedPromptId;
    onEditQueuedPrompt(queuedPromptId);
  };
  const handleEditQueuedPromptSelect = (queuedPromptId: string): void => {
    if (pointerHandledEditPromptIdRef.current === queuedPromptId) {
      pointerHandledEditPromptIdRef.current = null;
      return;
    }
    editQueuedPrompt(queuedPromptId);
  };

  useLayoutEffect(() => {
    if (queuedPrompts.length !== 1) {
      setIsSinglePromptOverflowing(false);
      return;
    }

    const element = singlePromptTextRef.current;
    if (!element) {
      setIsSinglePromptOverflowing(false);
      return;
    }

    const measure = (): void => {
      setIsSinglePromptOverflowing(
        element.scrollWidth > element.clientWidth + 1
      );
    };

    measure();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    resizeObserver?.observe(element);
    return () => {
      resizeObserver?.disconnect();
    };
  }, [queuedPrompts]);

  useLayoutEffect(() => {
    if (!canExpand && isExpanded) {
      setIsExpanded(false);
    }
  }, [canExpand, isExpanded]);

  useLayoutEffect(() => {
    const element = queuedPromptListRef.current;
    if (!element) {
      return;
    }

    const measure = (): void => {
      const viewportCap =
        typeof window === "undefined"
          ? 280
          : Math.round(window.innerHeight * 0.38);
      setExpandedListMaxHeightPx(
        Math.max(32, Math.min(280, viewportCap, element.scrollHeight))
      );
    };

    measure();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    resizeObserver?.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [queuedPrompts]);

  return (
    <div
      className={styles.composerQueuedPromptPanel}
      data-expanded={isExpanded ? "true" : "false"}
      data-expandable={canExpand ? "true" : "false"}
      style={panelStyle}
      tabIndex={canExpand ? 0 : -1}
      onClick={toggleExpanded}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.composerQueuedPromptHeader}>
        <span className={styles.composerQueuedPromptLabel}>
          {labels.queuedLabel}
        </span>
        <span className={styles.composerQueuedPromptCount}>
          {queuedPrompts.length}
        </span>
        {canExpand ? (
          <ChevronRight
            aria-hidden="true"
            className={styles.composerQueuedPromptExpandCue}
            data-testid="agent-gui-composer-queued-prompt-expand-cue"
            size={16}
            strokeWidth={2}
          />
        ) : null}
      </div>
      <div
        ref={queuedPromptListRef}
        className={styles.composerQueuedPromptList}
      >
        {queuedPrompts.map((queuedPrompt) => {
          const isDraining = queuedPrompt.id === drainingQueuedPromptId;
          return (
            <div
              key={queuedPrompt.id}
              className={styles.composerQueuedPromptRow}
              data-testid={`agent-gui-composer-queued-prompt-${queuedPrompt.id}`}
              data-draining={isDraining ? "true" : "false"}
            >
              <div className={styles.composerQueuedPromptMain}>
                <div
                  ref={
                    queuedPrompts.length === 1 ? singlePromptTextRef : undefined
                  }
                  className={styles.composerQueuedPromptText}
                  title={queuedPrompt.prompt}
                  onClick={(event) => {
                    if (
                      event.target instanceof Element &&
                      event.target.closest("a")
                    ) {
                      event.stopPropagation();
                    }
                  }}
                >
                  <AgentMessageMarkdown
                    content={queuedPrompt.prompt}
                    className="agent-gui-node__composer-queued-prompt-markdown"
                    inline
                    onLinkClick={onLinkClick}
                    workspaceAppIcons={workspaceAppIcons}
                  />
                </div>
              </div>
              <div className={styles.composerQueuedPromptActions}>
                <CanvasNodeGhostIconButton
                  aria-label={labels.sendQueuedPromptNext}
                  disabled={isDraining}
                  onClick={() => onSendQueuedPromptNext(queuedPrompt.id)}
                >
                  <CanvasNodeGuideLinedIcon aria-hidden="true" />
                </CanvasNodeGhostIconButton>
                <CanvasNodeGhostIconButton
                  aria-label={labels.deleteQueuedPrompt}
                  disabled={isDraining}
                  onClick={() => onRemoveQueuedPrompt(queuedPrompt.id)}
                >
                  <CanvasNodeTrashLinedIcon aria-hidden="true" />
                </CanvasNodeGhostIconButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <CanvasNodeGhostIconButton
                      aria-label={labels.queuedPromptMoreActions}
                      disabled={isDraining}
                      stopsEventPropagation={false}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <CanvasNodeMoreLinedIcon aria-hidden="true" />
                    </CanvasNodeGhostIconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={styles.composerMenuContent}
                    sideOffset={8}
                  >
                    <DropdownMenuItem
                      className={styles.composerMenuItem}
                      disabled={isDraining}
                      onPointerDown={(event) =>
                        handleEditQueuedPromptPointerDown(
                          event,
                          queuedPrompt.id
                        )
                      }
                      onSelect={() =>
                        handleEditQueuedPromptSelect(queuedPrompt.id)
                      }
                    >
                      <span>{labels.editQueuedPrompt}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
