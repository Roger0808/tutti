import * as React from "react";
import { Checkbox as UISystemCheckbox } from "@tutti-os/ui-system";

export interface CheckboxProps extends Omit<
  React.ComponentProps<typeof UISystemCheckbox>,
  "checked" | "onCheckedChange"
> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ onCheckedChange, ...props }, ref) => (
    <UISystemCheckbox
      ref={ref}
      onCheckedChange={(checked) => {
        onCheckedChange?.(checked === true);
      }}
      {...props}
    />
  )
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
