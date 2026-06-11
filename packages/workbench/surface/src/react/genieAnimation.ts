export interface WorkbenchGenieViewportRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export type WorkbenchGenieDirection = "open" | "minimize";

export interface WorkbenchGeniePoint {
  x: number;
  y: number;
}

export interface WorkbenchGenieScanlineFrame {
  direction: WorkbenchGenieDirection;
  dockPoint: WorkbenchGeniePoint;
  progress: number;
  texture: HTMLCanvasElement;
  textureRect: WorkbenchGenieViewportRect;
}

const genieHorizontalRowStagger = 0.65;
const genieVerticalRowStagger = 0.2;
const genieDockGlowRadius = 55;
const genieScanlineStrideThresholdPx = 640;
const genieMaxScanlineStride = 3;

export function clampGenieProgress(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function easeInOutCubic(value: number): number {
  const progress = clampGenieProgress(value);
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export function easeInQuadratic(value: number): number {
  const progress = clampGenieProgress(value);
  return progress * progress;
}

export function easeOutQuadratic(value: number): number {
  const progress = clampGenieProgress(value);
  return 1 - (1 - progress) * (1 - progress);
}

export function lerpGenieValue(
  from: number,
  to: number,
  progress: number
): number {
  return from + (to - from) * progress;
}

export function viewportRectFromElement(
  element: HTMLElement
): WorkbenchGenieViewportRect {
  const rect = element.getBoundingClientRect();
  return {
    height: rect.height,
    left: rect.left,
    top: rect.top,
    width: rect.width
  };
}

export function isUsableGenieRect(rect: WorkbenchGenieViewportRect): boolean {
  return rect.width > 0 && rect.height > 0;
}

export function centerPointFromRect(
  rect: WorkbenchGenieViewportRect
): WorkbenchGeniePoint {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function resolveGenieScanlineStride(textureHeight: number): number {
  return Math.max(
    1,
    Math.min(
      genieMaxScanlineStride,
      Math.ceil(textureHeight / genieScanlineStrideThresholdPx)
    )
  );
}

function resolveGenieDirtyRect({
  dockPoint,
  textureRect,
  viewportHeight,
  viewportWidth
}: {
  dockPoint: WorkbenchGeniePoint;
  textureRect: WorkbenchGenieViewportRect;
  viewportHeight: number;
  viewportWidth: number;
}): WorkbenchGenieViewportRect {
  const padding = genieDockGlowRadius + 4;
  const left = Math.max(
    0,
    Math.floor(Math.min(textureRect.left, dockPoint.x) - padding)
  );
  const top = Math.max(
    0,
    Math.floor(Math.min(textureRect.top, dockPoint.y) - padding)
  );
  const right = Math.min(
    viewportWidth,
    Math.ceil(
      Math.max(textureRect.left + textureRect.width, dockPoint.x) + padding
    )
  );
  const bottom = Math.min(
    viewportHeight,
    Math.ceil(
      Math.max(textureRect.top + textureRect.height, dockPoint.y) + padding
    )
  );

  return {
    height: Math.max(0, bottom - top),
    left,
    top,
    width: Math.max(0, right - left)
  };
}

function canInlineComputedStyle(
  element: Element
): element is HTMLElement | SVGElement {
  return (
    element instanceof HTMLElement ||
    (typeof SVGElement !== "undefined" && element instanceof SVGElement)
  );
}

export function copyGenieComputedStyleTree(
  source: Element,
  clone: Element
): void {
  if (canInlineComputedStyle(source) && canInlineComputedStyle(clone)) {
    const computed = window.getComputedStyle(source);
    if (computed.cssText) {
      clone.style.cssText = computed.cssText;
    } else {
      for (let index = 0; index < computed.length; index += 1) {
        const propertyName = computed.item(index);
        if (!propertyName) {
          continue;
        }
        clone.style.setProperty(
          propertyName,
          computed.getPropertyValue(propertyName),
          computed.getPropertyPriority(propertyName)
        );
      }
    }
    clone.style.animation = "none";
    clone.style.opacity = "1";
    clone.style.transition = "none";
    clone.style.visibility = "visible";
  }

  const sourceChildren = Array.from(source.children);
  const cloneChildren = Array.from(clone.children);
  for (let index = 0; index < sourceChildren.length; index += 1) {
    const sourceChild = sourceChildren[index];
    const cloneChild = cloneChildren[index];
    if (sourceChild && cloneChild) {
      copyGenieComputedStyleTree(sourceChild, cloneChild);
    }
  }
}

export function renderGenieScanlines(
  context: CanvasRenderingContext2D,
  viewportWidth: number,
  viewportHeight: number,
  frame: WorkbenchGenieScanlineFrame
): void {
  const { direction, dockPoint, texture, textureRect } = frame;
  const progress = clampGenieProgress(frame.progress);
  const textureWidth = Math.max(1, Math.round(textureRect.width));
  const textureHeight = Math.max(1, Math.round(textureRect.height));
  const scanlineStride = resolveGenieScanlineStride(textureHeight);
  const dirtyRect = resolveGenieDirtyRect({
    dockPoint,
    textureRect,
    viewportHeight,
    viewportWidth
  });

  context.clearRect(
    dirtyRect.left,
    dirtyRect.top,
    dirtyRect.width,
    dirtyRect.height
  );

  for (let y = 0; y < textureHeight; y += scanlineStride) {
    const sourceHeight = Math.min(scanlineStride, textureHeight - y);
    const sourceMidY = y + sourceHeight / 2;
    const rowProgress = sourceMidY / textureHeight;
    const horizontalStart =
      direction === "minimize"
        ? (1 - rowProgress) * genieHorizontalRowStagger
        : rowProgress * genieHorizontalRowStagger;
    const horizontalProgress = clampGenieProgress(
      (progress - horizontalStart) / (1 - horizontalStart)
    );
    const horizontalEase = easeInOutCubic(horizontalProgress);

    const verticalStart =
      direction === "minimize"
        ? (1 - rowProgress) * genieVerticalRowStagger
        : rowProgress * genieVerticalRowStagger;
    const verticalProgress = clampGenieProgress(
      (progress - verticalStart) / (1 - verticalStart)
    );
    const verticalEase = easeInQuadratic(verticalProgress);

    const left =
      direction === "minimize"
        ? lerpGenieValue(textureRect.left, dockPoint.x, horizontalEase)
        : lerpGenieValue(dockPoint.x, textureRect.left, horizontalEase);
    const right =
      direction === "minimize"
        ? lerpGenieValue(
            textureRect.left + textureWidth,
            dockPoint.x,
            horizontalEase
          )
        : lerpGenieValue(
            dockPoint.x,
            textureRect.left + textureWidth,
            horizontalEase
          );
    const targetY =
      (direction === "minimize"
        ? lerpGenieValue(
            textureRect.top + sourceMidY,
            dockPoint.y,
            verticalEase
          )
        : lerpGenieValue(
            dockPoint.y,
            textureRect.top + sourceMidY,
            verticalEase
          )) -
      sourceHeight / 2;
    const rowWidth = right - left;

    if (rowWidth < 0.8) {
      continue;
    }

    context.drawImage(
      texture,
      0,
      y,
      textureWidth,
      sourceHeight,
      left,
      targetY,
      rowWidth,
      Math.max(1, sourceHeight)
    );
  }

  const glowProgress = direction === "minimize" ? progress : 1 - progress;
  if (glowProgress <= 0.75) {
    return;
  }

  const glowAlpha = easeOutQuadratic((glowProgress - 0.75) / 0.25) * 0.3;
  const dockGlow = context.createRadialGradient(
    dockPoint.x,
    dockPoint.y,
    0,
    dockPoint.x,
    dockPoint.y,
    genieDockGlowRadius
  );
  dockGlow.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha})`);
  dockGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = dockGlow;
  context.fillRect(
    dirtyRect.left,
    dirtyRect.top,
    dirtyRect.width,
    dirtyRect.height
  );
}
