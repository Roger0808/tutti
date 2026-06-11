import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";

import { cn } from "#lib/utils";

type ScrollAreaProps = React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  viewportClassName?: string;
  viewportContentStyle?: React.CSSProperties;
  viewportProps?: Omit<
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Viewport>,
    "children" | "className" | "ref"
  >;
  viewportRef?: React.Ref<HTMLDivElement>;
  viewportTestId?: string;
};

function ScrollArea({
  className,
  children,
  viewportClassName,
  viewportContentStyle,
  viewportProps,
  viewportRef,
  viewportTestId,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("group/scroll-area relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        {...viewportProps}
        data-slot="scroll-area-viewport"
        data-testid={viewportTestId}
        ref={viewportRef}
        className={cn(
          "size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
          viewportClassName
        )}
      >
        {viewportContentStyle ? (
          <ScrollAreaViewportContentStyleBridge style={viewportContentStyle} />
        ) : null}
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollAreaViewportContentStyleBridge({
  style
}: {
  style: React.CSSProperties;
}) {
  const markerRef = React.useRef<HTMLSpanElement | null>(null);

  React.useLayoutEffect(() => {
    const contentElement = markerRef.current?.parentElement;
    if (!contentElement) {
      return;
    }

    const previousValues = new Map<
      string,
      { value: string; priority: string }
    >();

    for (const [property, value] of Object.entries(style) as Array<
      [string, React.CSSProperties[keyof React.CSSProperties]]
    >) {
      const cssProperty = toCssPropertyName(property);
      previousValues.set(cssProperty, {
        value: contentElement.style.getPropertyValue(cssProperty),
        priority: contentElement.style.getPropertyPriority(cssProperty)
      });

      if (value === undefined || value === null) {
        contentElement.style.removeProperty(cssProperty);
      } else {
        contentElement.style.setProperty(cssProperty, String(value));
      }
    }

    return () => {
      for (const [cssProperty, previous] of previousValues) {
        if (previous.value) {
          contentElement.style.setProperty(
            cssProperty,
            previous.value,
            previous.priority
          );
        } else {
          contentElement.style.removeProperty(cssProperty);
        }
      }
    };
  }, [style]);

  return (
    <span ref={markerRef} data-slot="scroll-area-content-style-bridge" hidden />
  );
}

function toCssPropertyName(property: string): string {
  return property.startsWith("--")
    ? property
    : property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/scrollbar absolute z-10 flex touch-none p-[2px] opacity-0 transition-opacity duration-150 select-none group-hover/scroll-area:opacity-100 group-focus-within/scroll-area:opacity-100 data-[orientation=horizontal]:right-0 data-[orientation=horizontal]:bottom-0 data-[orientation=horizontal]:left-0 data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:top-0 data-[orientation=vertical]:right-0 data-[orientation=vertical]:bottom-0 data-[orientation=vertical]:w-2",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-[var(--transparency-block)] transition-colors duration-150 group-hover/scrollbar:bg-[var(--transparency-hover)]"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
