import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

export type OverlayKind = "dialog" | "modal" | "panel" | "window" | "popover";

export interface OverlayDescriptor {
  id: string;
  kind: OverlayKind;
  interactive: boolean;
  blocking: boolean;
  priority: number;
  dismissOnEscape: boolean;
  dismissOnBackdrop: boolean;
  restoreFocus: boolean;
  occludesWebsite: boolean;
}

interface OverlayHandlers {
  onRequestClose?: () => void;
}

interface OverlayRegistrationEntry {
  descriptor: OverlayDescriptor;
  openedOrder: number;
  handlers: OverlayHandlers;
}

export interface ActiveOverlayEntry extends OverlayDescriptor {
  openedOrder: number;
}

interface OverlayCoordinatorState {
  activeInteractiveOverlays: ActiveOverlayEntry[];
  topmostInteractiveOverlay: ActiveOverlayEntry | null;
  shouldOccludeWebsiteWindows: boolean;
  shouldLockBodyScroll: boolean;
}

interface OverlayCoordinatorContextValue extends OverlayCoordinatorState {
  registerOverlay: (
    descriptor: OverlayDescriptor,
    handlers: OverlayHandlers
  ) => void;
  unregisterOverlay: (overlayId: string) => void;
}

const OverlayCoordinatorContext =
  createContext<OverlayCoordinatorContextValue | null>(null);

function descriptorsEqual(
  left: OverlayDescriptor,
  right: OverlayDescriptor
): boolean {
  return (
    left.id === right.id &&
    left.kind === right.kind &&
    left.interactive === right.interactive &&
    left.blocking === right.blocking &&
    left.priority === right.priority &&
    left.dismissOnEscape === right.dismissOnEscape &&
    left.dismissOnBackdrop === right.dismissOnBackdrop &&
    left.restoreFocus === right.restoreFocus &&
    left.occludesWebsite === right.occludesWebsite
  );
}

export function resolveOverlayCoordinatorState(
  entries: Array<Pick<OverlayRegistrationEntry, "descriptor" | "openedOrder">>
): OverlayCoordinatorState {
  const activeInteractiveOverlays = entries
    .filter((entry) => entry.descriptor.interactive)
    .map((entry) => ({
      ...entry.descriptor,
      openedOrder: entry.openedOrder
    }))
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return right.priority - left.priority;
      }

      return right.openedOrder - left.openedOrder;
    });

  return {
    activeInteractiveOverlays,
    topmostInteractiveOverlay: activeInteractiveOverlays[0] ?? null,
    shouldOccludeWebsiteWindows: activeInteractiveOverlays.some(
      (entry) => entry.occludesWebsite
    ),
    shouldLockBodyScroll: activeInteractiveOverlays.some(
      (entry) => entry.blocking
    )
  };
}

function useOverlayCoordinatorContext(): OverlayCoordinatorContextValue {
  const value = useContext(OverlayCoordinatorContext);
  if (!value) {
    throw new Error("OverlayCoordinatorProvider is missing");
  }

  return value;
}

export function OverlayCoordinatorProvider({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  "use memo";
  const [registrationsById, setRegistrationsById] = useState<
    Map<string, OverlayRegistrationEntry>
  >(() => new Map());
  const nextOpenedOrderRef = useRef(1);
  const previousInteractiveCountRef = useRef(0);
  const restoreFocusTargetRef = useRef<HTMLElement | null>(null);
  const previousBodyOverflowRef = useRef<string | null>(null);

  const registerOverlay = useCallback(
    (descriptor: OverlayDescriptor, handlers: OverlayHandlers): void => {
      setRegistrationsById((current) => {
        const existing = current.get(descriptor.id);
        if (existing) {
          if (
            descriptorsEqual(existing.descriptor, descriptor) &&
            existing.handlers.onRequestClose === handlers.onRequestClose
          ) {
            return current;
          }

          const next = new Map(current);
          next.set(descriptor.id, {
            ...existing,
            descriptor,
            handlers
          });
          return next;
        }

        const next = new Map(current);
        next.set(descriptor.id, {
          descriptor,
          openedOrder: nextOpenedOrderRef.current++,
          handlers
        });
        return next;
      });
    },
    []
  );

  const unregisterOverlay = useCallback((overlayId: string): void => {
    setRegistrationsById((current) => {
      if (!current.has(overlayId)) {
        return current;
      }

      const next = new Map(current);
      next.delete(overlayId);
      return next;
    });
  }, []);

  const coordinatorState = useMemo(
    () => resolveOverlayCoordinatorState([...registrationsById.values()]),
    [registrationsById]
  );

  useEffect(() => {
    const interactiveCount = coordinatorState.activeInteractiveOverlays.length;
    const previousCount = previousInteractiveCountRef.current;

    if (previousCount === 0 && interactiveCount > 0) {
      const activeElement = document.activeElement;
      restoreFocusTargetRef.current =
        activeElement instanceof HTMLElement ? activeElement : null;
    } else if (previousCount > 0 && interactiveCount === 0) {
      const focusTarget = restoreFocusTargetRef.current;
      restoreFocusTargetRef.current = null;
      if (focusTarget && document.contains(focusTarget)) {
        window.setTimeout(() => {
          focusTarget.focus();
        }, 0);
      }
    }

    previousInteractiveCountRef.current = interactiveCount;
  }, [coordinatorState.activeInteractiveOverlays.length]);

  useEffect(() => {
    if (!coordinatorState.shouldLockBodyScroll) {
      if (previousBodyOverflowRef.current !== null) {
        document.body.style.overflow = previousBodyOverflowRef.current;
        previousBodyOverflowRef.current = null;
      }
      return;
    }

    if (previousBodyOverflowRef.current === null) {
      previousBodyOverflowRef.current = document.body.style.overflow;
    }

    document.body.style.overflow = "hidden";

    return () => {
      if (previousBodyOverflowRef.current !== null) {
        document.body.style.overflow = previousBodyOverflowRef.current;
        previousBodyOverflowRef.current = null;
      }
    };
  }, [coordinatorState.shouldLockBodyScroll]);

  useEffect(() => {
    const topmost = coordinatorState.topmostInteractiveOverlay;
    if (!topmost || !topmost.dismissOnEscape) {
      return;
    }

    const registration = registrationsById.get(topmost.id);
    const onRequestClose = registration?.handlers.onRequestClose;
    if (typeof onRequestClose !== "function") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onRequestClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [coordinatorState.topmostInteractiveOverlay, registrationsById]);

  const contextValue = useMemo<OverlayCoordinatorContextValue>(
    () => ({
      ...coordinatorState,
      registerOverlay,
      unregisterOverlay
    }),
    [coordinatorState, registerOverlay, unregisterOverlay]
  );

  return (
    <OverlayCoordinatorContext.Provider value={contextValue}>
      {children}
    </OverlayCoordinatorContext.Provider>
  );
}

export function useOverlayCoordinator(): OverlayCoordinatorState & {
  isOverlayTopmost: (overlayId: string) => boolean;
} {
  const value = useOverlayCoordinatorContext();
  const topmostOverlayId = value.topmostInteractiveOverlay?.id ?? null;
  const isOverlayTopmost = useCallback(
    (overlayId: string) => topmostOverlayId === overlayId,
    [topmostOverlayId]
  );

  return useMemo(
    () => ({
      activeInteractiveOverlays: value.activeInteractiveOverlays,
      topmostInteractiveOverlay: value.topmostInteractiveOverlay,
      shouldOccludeWebsiteWindows: value.shouldOccludeWebsiteWindows,
      shouldLockBodyScroll: value.shouldLockBodyScroll,
      isOverlayTopmost
    }),
    [
      value.activeInteractiveOverlays,
      value.topmostInteractiveOverlay,
      value.shouldLockBodyScroll,
      value.shouldOccludeWebsiteWindows,
      isOverlayTopmost
    ]
  );
}

export function useOverlayRegistration(
  descriptor: OverlayDescriptor,
  isOpen: boolean,
  handlers: OverlayHandlers = {}
): void {
  const { registerOverlay, unregisterOverlay } = useOverlayCoordinatorContext();
  const latestDescriptorRef = useRef(descriptor);
  const latestHandlersRef = useRef(handlers);
  const hasOnRequestClose = typeof handlers.onRequestClose === "function";

  latestDescriptorRef.current = descriptor;
  latestHandlersRef.current = handlers;

  const registeredHandlers = useMemo<OverlayHandlers>(() => {
    if (!hasOnRequestClose) {
      return {};
    }

    return {
      onRequestClose: () => {
        latestHandlersRef.current.onRequestClose?.();
      }
    };
  }, [hasOnRequestClose]);

  useEffect(() => {
    if (!isOpen) {
      unregisterOverlay(descriptor.id);
      return;
    }

    registerOverlay(latestDescriptorRef.current, registeredHandlers);
    return () => {
      unregisterOverlay(descriptor.id);
    };
  }, [
    descriptor.id,
    isOpen,
    registerOverlay,
    registeredHandlers,
    unregisterOverlay
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    registerOverlay(descriptor, registeredHandlers);
  }, [
    descriptor.blocking,
    descriptor.dismissOnBackdrop,
    descriptor.dismissOnEscape,
    descriptor.id,
    descriptor.interactive,
    descriptor.kind,
    descriptor.occludesWebsite,
    descriptor.priority,
    descriptor.restoreFocus,
    isOpen,
    registerOverlay,
    registeredHandlers
  ]);
}

export function useTopmostOverlayDismiss(
  overlayId: string,
  onDismiss: () => void
): () => void {
  const { isOverlayTopmost } = useOverlayCoordinator();

  return useCallback(() => {
    if (!isOverlayTopmost(overlayId)) {
      return;
    }

    onDismiss();
  }, [isOverlayTopmost, onDismiss, overlayId]);
}
