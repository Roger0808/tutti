import * as React from "react";
import { ToastProvider, ToastRoot, ToastTitle, cn } from "@tutti-os/ui-system";

const SHELL_TOP_TOAST_Z_INDEX = 100550;
const SHELL_TOP_TOAST_ALERT_Z_INDEX = 100551;

/** Toast lines omit terminal sentence punctuation (ASCII / fullwidth / ideographic full stop). */
export function stripToastTrailingSentencePunctuation(value: string): string {
  let s = value.replace(/\s+$/u, "");
  while (s.length > 0) {
    const last = s.at(-1);
    if (last === "." || last === "。" || last === "．") {
      s = s.slice(0, -1).replace(/\s+$/u, "");
    } else {
      break;
    }
  }
  return s;
}

function formatToastText(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string") {
    return stripToastTrailingSentencePunctuation(children);
  }
  if (
    typeof children === "number" ||
    typeof children === "boolean" ||
    children === null ||
    children === undefined
  ) {
    return children;
  }
  const flat = React.Children.toArray(children);
  if (flat.length === 1 && typeof flat[0] === "string") {
    return stripToastTrailingSentencePunctuation(flat[0]);
  }
  return children;
}

export type ShellTopToastProps = {
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
  open?: boolean;
  /** `default` — inverted strip (light: dark surface; dark: light surface); `warning` / `error` — destructive alert strip. */
  tone?: "default" | "warning" | "error";
  /** Shows a small spinner before children (long-running operations). */
  busy?: boolean;
  /**
   * `viewport` — fixed under titlebar reserve (full window).
   * `node` — centered horizontally inside a positioned parent; vertical offset via `nodeInsetTopPx`.
   */
  anchor?: "viewport" | "node";
  /** When `anchor="node"`, offset from the positioning parent's top edge (px). Default 16. */
  nodeInsetTopPx?: number;
};

export function ShellTopToast({
  children,
  className,
  "data-testid": dataTestId = "tsh-desktop-toast",
  open = true,
  tone = "default",
  busy = false,
  anchor = "viewport",
  nodeInsetTopPx = 16
}: ShellTopToastProps) {
  "use memo";
  const isAlert = tone === "error" || tone === "warning";
  const zIndex = isAlert
    ? SHELL_TOP_TOAST_ALERT_Z_INDEX
    : SHELL_TOP_TOAST_Z_INDEX;
  const boxShadow =
    tone === "error"
      ? "0 12px 32px color-mix(in srgb, var(--cove-shadow-color-panel) 70%, transparent)"
      : "0 8px 28px color-mix(in srgb, var(--cove-shadow-color-panel) 65%, transparent)";

  return (
    <ToastProvider>
      <ToastRoot
        open={open}
        busy={busy}
        anchor={anchor}
        nodeInsetTopPx={nodeInsetTopPx}
        variant={isAlert ? "destructive" : "default"}
        data-testid={dataTestId}
        data-anchor={anchor}
        className={cn(
          "t-shell-top-toast pointer-events-none font-semibold",
          anchor === "viewport" &&
            "fixed left-1/2 -translate-x-1/2 data-[state=closed]:slide-out-to-top-full data-[state=open]:slide-in-from-top-full",
          tone === "default" &&
            "border-[color:var(--tsh-shell-toast-neutral-border)] bg-[color:var(--tsh-shell-toast-neutral-bg)] text-[color:var(--tsh-shell-toast-neutral-fg)]",
          className
        )}
        style={{
          zIndex,
          boxShadow,
          ...(anchor === "node"
            ? { top: `${nodeInsetTopPx}px` }
            : { top: "calc(var(--cove-titlebar-reserve, 0px) + 12px)" })
        }}
      >
        <ToastTitle className="font-semibold">
          {formatToastText(children)}
        </ToastTitle>
      </ToastRoot>
    </ToastProvider>
  );
}
