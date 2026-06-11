import type { JSX } from "react";
import { Minus } from "lucide-react";
import { useTranslation } from "../../i18n/index";
import { CanvasNodeGhostIconButton } from "./CanvasNodeGhostIconButton";

export function CanvasNodeMinimizeButton({
  onMinimize,
  testId,
  className,
  ...rest
}: {
  onMinimize: () => void;
  testId: string;
  className?: string;
} & { "data-window-header"?: "top" }): JSX.Element {
  "use memo";
  const { t } = useTranslation();
  return (
    <CanvasNodeGhostIconButton
      data-testid={testId}
      aria-label={t("common.minimize")}
      title={t("common.minimize")}
      className={className}
      {...rest}
      onClick={() => {
        onMinimize();
      }}
    >
      <Minus className="shrink-0" aria-hidden="true" strokeWidth={2.25} />
    </CanvasNodeGhostIconButton>
  );
}
