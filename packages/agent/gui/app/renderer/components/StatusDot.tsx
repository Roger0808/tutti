export { StatusDot } from "@tutti-os/ui-system";

export type StatusDotTone = "neutral" | "green" | "blue" | "amber" | "red";
export type StatusDotSize = "xs" | "sm" | "md";
export interface StatusDotProps {
  tone?: StatusDotTone;
  size?: StatusDotSize;
  pulse?: boolean;
  ariaLabel?: string;
  title?: string;
  className?: string;
}
