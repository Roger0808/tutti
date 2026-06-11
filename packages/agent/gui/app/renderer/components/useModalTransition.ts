import { useEffect, useMemo, useState } from "react";

const MODAL_CLOSE_DURATION_MS = import.meta.env.MODE === "test" ? 0 : 350;

type ModalTransitionPhase = "open" | "closing";

export interface ModalTransitionState {
  isMounted: boolean;
  className: "is-open" | "is-closing";
}

export function useModalTransition(
  open: boolean,
  closeDurationMs = MODAL_CLOSE_DURATION_MS
): ModalTransitionState {
  const [isMounted, setIsMounted] = useState(open);
  const [phase, setPhase] = useState<ModalTransitionPhase>(
    open ? "open" : "closing"
  );

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      setPhase("open");
      return undefined;
    }

    setPhase("closing");
    if (closeDurationMs <= 0) {
      setIsMounted(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsMounted(false);
    }, closeDurationMs);

    return () => window.clearTimeout(timeoutId);
  }, [closeDurationMs, open]);

  return useMemo(
    () => ({
      isMounted,
      className: phase === "open" ? "is-open" : "is-closing"
    }),
    [isMounted, phase]
  );
}
