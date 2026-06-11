import * as React from "react";
import { Input } from "@tutti-os/ui-system";
import { cn } from "../../lib/utils";

type InputLargeVariant = "default" | "centered" | "centeredUnderline";

interface InputLargeProps extends Omit<
  React.ComponentProps<typeof Input>,
  "variant"
> {
  variant?: InputLargeVariant;
}

const InputLarge = React.forwardRef<HTMLInputElement, InputLargeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <Input
      ref={ref}
      data-tsh-input-large="true"
      className={cn(
        "h-10 min-h-10 rounded-xl px-3",
        variant === "centered" && "text-center",
        variant === "centeredUnderline" &&
          "rounded-none border-x-0 border-t-0 border-b-2 border-[color:var(--text-primary)] bg-transparent px-0 text-center text-[18px] font-semibold text-[color:var(--text-primary)] hover:bg-transparent focus-visible:bg-transparent",
        className
      )}
      {...props}
    />
  )
);

InputLarge.displayName = "InputLarge";

export { InputLarge };
