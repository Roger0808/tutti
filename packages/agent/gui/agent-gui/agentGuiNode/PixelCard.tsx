import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode
} from "react";

type PixelCardVariantConfig = {
  gap: number;
  speed: number;
  colors: string;
  noFocus: boolean;
};

type CanvasSize = {
  width: number;
  height: number;
  dpr: number;
  contentWidth: number;
  contentHeight: number;
  overscan: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  restoreStartX: number;
  restoreStartY: number;
  color: string;
  alpha: number;
  size: number;
  seed: number;
  drift: number;
  layer: number;
};

type PointerState = {
  x: number;
  y: number;
  active: boolean;
  restoreStartedAt: number | null;
};

const DEFAULT_PIXEL_COLOR = "#f8fafc";
const DEFAULT_VARIANT: PixelCardVariantConfig = {
  gap: 5,
  speed: 35,
  colors: `${DEFAULT_PIXEL_COLOR},#f1f5f9,#cbd5e1`,
  noFocus: false
};

const VARIANTS: Record<string, PixelCardVariantConfig> = {
  default: DEFAULT_VARIANT,
  blue: {
    gap: 10,
    speed: 25,
    colors: "#e0f2fe,#7dd3fc,#0ea5e9",
    noFocus: false
  },
  yellow: {
    gap: 3,
    speed: 20,
    colors: "#fef08a,#fde047,#eab308",
    noFocus: false
  },
  pink: {
    gap: 6,
    speed: 80,
    colors: "#fecdd3,#fda4af,#e11d48",
    noFocus: true
  }
};

const MAX_PARTICLES = 5_600;
const PARTICLE_CANVAS_OVERSCAN = 48;
const PARTICLE_LAYER_FADE_DURATION_MS = 300;
const PARTICLE_RESTORE_DURATION_MS = 600;
const PARTICLE_LAYER_SETTLE_DURATION_MS = Math.max(
  PARTICLE_LAYER_FADE_DURATION_MS,
  PARTICLE_RESTORE_DURATION_MS
);
const AMBIENT_PARTICLE_RADIUS_RATIO = 0.48;
const HERO_ART_SCALE = 1;
const ICON_SAMPLE_SCALE = HERO_ART_SCALE;
const IMAGE_ALPHA_THRESHOLD = 56;
const AMBIENT_PARTICLE_RATIO = 0.5;
const PARTICLE_EFFECT_SCALE = 0.4;
const PARTICLE_INTERACTION_RADIUS = 12;
const PARTICLE_INTERACTION_SOFT_EDGE = 2.75;
const PARTICLE_STIFFNESS = 0.001;
const PARTICLE_DAMPING = 0.96;
const PARTICLE_JITTER = 0.25;
const PARTICLE_SIZE_SCALE = 1.2;
const PARTICLE_REPEL_STRENGTH = 1;
const PARTICLE_REPEL_CENTER_SCALE = 0.72;
const IMAGE_PARTICLE_ALPHA = 1;
const IDLE_IMAGE_PARTICLE_FLOAT_X = 1.6;
const IDLE_IMAGE_PARTICLE_FLOAT_Y = 1.6;
const IDLE_AMBIENT_PARTICLE_FLOAT_X = 2.4;
const IDLE_AMBIENT_PARTICLE_FLOAT_Y = 5;

export interface PixelCardProps {
  variant?: string;
  gap?: number;
  speed?: number;
  colors?: string;
  imageSrc?: string;
  noFocus?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

function getRandomValue(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function getPrefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function getTimeNow(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}

function normalizeGap(value: number): number {
  return Number.isFinite(value)
    ? Math.max(2, Math.floor(value))
    : DEFAULT_VARIANT.gap;
}

function normalizeColors(value: string): string[] {
  const colors = value
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean);
  return colors.length > 0 ? colors : normalizeColors(DEFAULT_VARIANT.colors);
}

function getMotionScale(value: number, reducedMotion: boolean): number {
  if (reducedMotion || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.min(1.8, Math.max(0.35, value / 45));
}

function pickColor(palette: string[]): string {
  return (
    palette[Math.floor(Math.random() * palette.length)] ??
    palette[0] ??
    DEFAULT_PIXEL_COLOR
  );
}

function createParticle({
  x,
  y,
  color,
  alpha,
  size,
  layer,
  reducedMotion
}: {
  x: number;
  y: number;
  color: string;
  alpha: number;
  size: number;
  layer: number;
  reducedMotion: boolean;
}): Particle {
  const initialOffset = reducedMotion
    ? 0
    : getRandomValue(-PARTICLE_JITTER, PARTICLE_JITTER);

  return {
    x: x + initialOffset,
    y: y + initialOffset,
    vx: 0,
    vy: 0,
    baseX: x,
    baseY: y,
    restoreStartX: x + initialOffset,
    restoreStartY: y + initialOffset,
    color,
    alpha,
    size,
    seed: Math.random() * Math.PI * 2,
    drift: getRandomValue(0.8, 1.65),
    layer
  };
}

function createAmbientParticles({
  width,
  height,
  gap,
  palette,
  reducedMotion
}: {
  width: number;
  height: number;
  gap: number;
  palette: string[];
  reducedMotion: boolean;
}): Particle[] {
  const availableCells = Math.floor(
    (width * height * HERO_ART_SCALE * HERO_ART_SCALE) / (gap * gap)
  );
  const count = Math.min(
    1_080,
    Math.max(120, Math.floor(availableCells * AMBIENT_PARTICLE_RATIO))
  );
  const particles: Particle[] = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width * AMBIENT_PARTICLE_RADIUS_RATIO * HERO_ART_SCALE;
  const radiusY = height * AMBIENT_PARTICLE_RADIUS_RATIO * HERO_ART_SCALE;

  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random());
    const x = centerX + Math.cos(angle) * radiusX * radius;
    const y = centerY + Math.sin(angle) * radiusY * radius;
    const centerDistance = Math.hypot(
      (x - centerX) / radiusX,
      (y - centerY) / radiusY
    );
    const edgeFade = Math.max(
      0.16,
      1 - Math.max(0, centerDistance - 0.5) * 1.35
    );

    particles.push(
      createParticle({
        x,
        y,
        color: pickColor(palette),
        alpha: getRandomValue(0.2, 0.54) * edgeFade,
        size: getRandomValue(0.36, 0.72) * PARTICLE_SIZE_SCALE,
        layer: 0,
        reducedMotion
      })
    );
  }

  return particles;
}

function loadParticleImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

async function createImageParticles({
  width,
  height,
  contentWidth,
  contentHeight,
  gap,
  imageSrc,
  reducedMotion
}: {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  gap: number;
  imageSrc: string | undefined;
  reducedMotion: boolean;
}): Promise<Particle[]> {
  if (!imageSrc || typeof document === "undefined") {
    return [];
  }

  const image = await loadParticleImage(imageSrc);
  if (!image) {
    return [];
  }

  const sampleSize = Math.max(
    1,
    Math.floor(Math.min(contentWidth, contentHeight) * ICON_SAMPLE_SCALE)
  );
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;

  const sampleContext = sampleCanvas.getContext("2d", {
    willReadFrequently: true
  });
  if (!sampleContext) {
    return [];
  }

  const naturalWidth = image.naturalWidth || sampleSize;
  const naturalHeight = image.naturalHeight || sampleSize;
  const scale = Math.min(sampleSize / naturalWidth, sampleSize / naturalHeight);
  const drawWidth = naturalWidth * scale;
  const drawHeight = naturalHeight * scale;
  const drawX = (sampleSize - drawWidth) / 2;
  const drawY = (sampleSize - drawHeight) / 2;

  try {
    sampleContext.clearRect(0, 0, sampleSize, sampleSize);
    sampleContext.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  } catch {
    return [];
  }

  let imageData: ImageData;
  try {
    imageData = sampleContext.getImageData(0, 0, sampleSize, sampleSize);
  } catch {
    return [];
  }

  const particles: Particle[] = [];
  const data = imageData.data;
  const left = (width - sampleSize) / 2;
  const top = (height - sampleSize) / 2;

  for (let y = 0; y < sampleSize; y += gap) {
    for (let x = 0; x < sampleSize; x += gap) {
      const dataIndex = (y * sampleSize + x) * 4;
      const alpha = data[dataIndex + 3] ?? 0;
      if (alpha < IMAGE_ALPHA_THRESHOLD) {
        continue;
      }

      const red = data[dataIndex] ?? 248;
      const green = data[dataIndex + 1] ?? 250;
      const blue = data[dataIndex + 2] ?? 252;
      const brightness = (red + green + blue) / 3;
      const size =
        (brightness > 224
          ? getRandomValue(0.62, 0.9)
          : getRandomValue(0.78, 1.12)) * PARTICLE_SIZE_SCALE;

      particles.push(
        createParticle({
          x: left + x,
          y: top + y,
          color: `rgb(${red}, ${green}, ${blue})`,
          alpha: IMAGE_PARTICLE_ALPHA,
          size,
          layer: 1,
          reducedMotion
        })
      );
    }
  }

  return particles;
}

function limitParticles(particles: Particle[]): Particle[] {
  if (particles.length <= MAX_PARTICLES) {
    return particles.sort((first, second) => first.layer - second.layer);
  }

  const imageParticles = particles.filter((particle) => particle.layer > 0);
  const ambientParticles = particles.filter((particle) => particle.layer === 0);
  const imageLimit = Math.min(
    imageParticles.length,
    Math.floor(MAX_PARTICLES * 0.78)
  );
  const ambientLimit = MAX_PARTICLES - imageLimit;

  return [
    ...ambientParticles.slice(0, ambientLimit),
    ...imageParticles.slice(0, imageLimit)
  ].sort((first, second) => first.layer - second.layer);
}

export default function PixelCard({
  variant = "default",
  gap,
  speed,
  colors,
  imageSrc,
  noFocus,
  className = "",
  style,
  children
}: PixelCardProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pointerRef = useRef<PointerState>({
    x: 0,
    y: 0,
    active: false,
    restoreStartedAt: null
  });
  const sizeRef = useRef<CanvasSize>({
    width: 0,
    height: 0,
    dpr: 1,
    contentWidth: 0,
    contentHeight: 0,
    overscan: 0
  });
  const animationRef = useRef<number | null>(null);
  const animationStepRef = useRef<() => void>(() => undefined);
  const particleFadeTimerRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const [isActive, setIsActive] = useState(false);
  const [isParticleLayerVisible, setIsParticleLayerVisible] = useState(false);
  const [isParticleLayerSettling, setIsParticleLayerSettling] = useState(false);
  const reducedMotion = useMemo(getPrefersReducedMotion, []);

  const variantCfg = VARIANTS[variant] ?? DEFAULT_VARIANT;
  const finalGap = gap ?? variantCfg.gap;
  const finalSpeed = speed ?? variantCfg.speed;
  const finalColors = colors ?? variantCfg.colors;
  const finalNoFocus = noFocus ?? variantCfg.noFocus;
  const palette = useMemo(() => normalizeColors(finalColors), [finalColors]);
  const motionScale =
    getMotionScale(finalSpeed, reducedMotion) * PARTICLE_EFFECT_SCALE;
  const shouldRenderStaticImage = false;
  const hasStaticImage = shouldRenderStaticImage;
  const isParticleLayerShown = !hasStaticImage || isParticleLayerVisible;
  const shouldAnimateParticles =
    isActive ||
    isParticleLayerShown ||
    isParticleLayerSettling ||
    !hasStaticImage;

  const clearParticleFadeTimer = useCallback((): void => {
    if (
      particleFadeTimerRef.current === null ||
      typeof window === "undefined"
    ) {
      return;
    }
    window.clearTimeout(particleFadeTimerRef.current);
    particleFadeTimerRef.current = null;
  }, []);

  const cancelAnimation = useCallback((): void => {
    if (animationRef.current === null || typeof window === "undefined") {
      return;
    }
    window.cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
  }, []);

  const beginParticleRestore = useCallback((): void => {
    const now = getTimeNow();
    pointerRef.current.active = false;
    pointerRef.current.restoreStartedAt = now;
    for (const particle of particlesRef.current) {
      particle.restoreStartX = particle.x;
      particle.restoreStartY = particle.y;
      particle.vx = 0;
      particle.vy = 0;
    }
  }, []);

  const drawParticles = useCallback((): void => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    const { width, height, dpr } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    for (const particle of particlesRef.current) {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, []);

  const syncCanvasSize = useCallback((): boolean => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return false;
    }

    const rect = container.getBoundingClientRect();
    const contentWidth = Math.floor(rect.width);
    const contentHeight = Math.floor(rect.height);
    if (contentWidth <= 0 || contentHeight <= 0) {
      particlesRef.current = [];
      return false;
    }

    const overscan = Math.min(
      PARTICLE_CANVAS_OVERSCAN,
      Math.floor(Math.min(contentWidth, contentHeight) * 0.32)
    );
    const width = contentWidth + overscan * 2;
    const height = contentHeight + overscan * 2;
    const dpr =
      typeof window === "undefined"
        ? 1
        : Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.left = `${-overscan}px`;
    canvas.style.top = `${-overscan}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    sizeRef.current = {
      width,
      height,
      dpr,
      contentWidth,
      contentHeight,
      overscan
    };

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      particlesRef.current = [];
      return false;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }, []);

  const buildParticles = useCallback((): void => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;

    if (!syncCanvasSize()) {
      return;
    }

    const { width, height, contentWidth, contentHeight } = sizeRef.current;
    const normalizedGap = normalizeGap(finalGap);
    const ambientParticles = createAmbientParticles({
      width,
      height,
      gap: normalizedGap,
      palette,
      reducedMotion
    });
    particlesRef.current = limitParticles(ambientParticles);
    drawParticles();

    void createImageParticles({
      width,
      height,
      contentWidth,
      contentHeight,
      gap: normalizedGap,
      imageSrc,
      reducedMotion
    }).then((imageParticles) => {
      if (generationRef.current !== generation) {
        return;
      }

      particlesRef.current = limitParticles([
        ...ambientParticles,
        ...imageParticles
      ]);
      drawParticles();
    });
  }, [
    drawParticles,
    finalGap,
    imageSrc,
    palette,
    reducedMotion,
    syncCanvasSize
  ]);

  const stepParticles = useCallback((): boolean => {
    const particles = particlesRef.current;
    if (particles.length === 0 || reducedMotion || motionScale <= 0) {
      return false;
    }

    const { width, height } = sizeRef.current;
    const pointer = pointerRef.current;
    const pointerActive = pointer.active;
    const pointerRadius = Math.min(
      Math.max(width, height),
      PARTICLE_INTERACTION_RADIUS
    );
    const repelStrength = PARTICLE_REPEL_STRENGTH;
    const spring = PARTICLE_STIFFNESS;
    const damping = PARTICLE_DAMPING;
    const nowMs = getTimeNow();
    const now = nowMs * 0.001;
    const restoreStartedAt = pointer.restoreStartedAt;
    const restoreProgress =
      !pointerActive && restoreStartedAt !== null
        ? Math.min(1, (nowMs - restoreStartedAt) / PARTICLE_RESTORE_DURATION_MS)
        : 1;
    const restoreEase = 1 - Math.pow(1 - restoreProgress, 3);
    for (const particle of particles) {
      const isImageParticle = particle.layer > 0;
      const idlePhase = now * (particle.drift * 0.72 + 0.18) + particle.seed;
      const particleIdleX =
        Math.sin(idlePhase * 0.56 + particle.seed) *
        (isImageParticle
          ? IDLE_IMAGE_PARTICLE_FLOAT_X
          : IDLE_AMBIENT_PARTICLE_FLOAT_X) *
        motionScale;
      const particleIdleY =
        Math.sin(idlePhase) *
        (isImageParticle
          ? IDLE_IMAGE_PARTICLE_FLOAT_Y
          : IDLE_AMBIENT_PARTICLE_FLOAT_Y) *
        motionScale;
      const idleX = pointerActive
        ? Math.sin(now * particle.drift + particle.seed) * PARTICLE_JITTER
        : particleIdleX;
      const idleY = pointerActive
        ? Math.cos(now * particle.drift * 0.82 + particle.seed) *
          PARTICLE_JITTER
        : particleIdleY;

      if (!pointerActive) {
        particle.vx = 0;
        particle.vy = 0;
        const targetX = particle.baseX + idleX;
        const targetY = particle.baseY + idleY;
        particle.x =
          particle.restoreStartX +
          (targetX - particle.restoreStartX) * restoreEase;
        particle.y =
          particle.restoreStartY +
          (targetY - particle.restoreStartY) * restoreEase;
        continue;
      }

      let forceX = 0;
      let forceY = 0;

      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;
      const normalizedDistance = distance / pointerRadius;
      if (normalizedDistance < PARTICLE_INTERACTION_SOFT_EDGE) {
        const centerScale =
          PARTICLE_REPEL_CENTER_SCALE +
          (1 - PARTICLE_REPEL_CENTER_SCALE) * Math.min(1, normalizedDistance);
        const force =
          Math.exp(-(normalizedDistance * normalizedDistance) * 0.9) *
          centerScale *
          repelStrength;
        forceX = (dx / distance) * force;
        forceY = (dy / distance) * force;
      }

      particle.vx += (particle.baseX + idleX - particle.x) * spring + forceX;
      particle.vy += (particle.baseY + idleY - particle.y) * spring + forceY;
      particle.vx *= damping;
      particle.vy *= damping;
      particle.x += particle.vx;
      particle.y += particle.vy;
    }

    if (!pointerActive && restoreStartedAt !== null && restoreProgress >= 1) {
      pointer.restoreStartedAt = null;
    }

    return true;
  }, [motionScale, reducedMotion]);

  const startAnimation = useCallback((): void => {
    if (typeof window === "undefined" || animationRef.current !== null) {
      return;
    }
    animationRef.current = window.requestAnimationFrame(
      animationStepRef.current
    );
  }, []);

  const runAnimationFrame = useCallback((): void => {
    animationRef.current = null;
    const shouldContinue = stepParticles();
    drawParticles();
    if (shouldContinue) {
      startAnimation();
    }
  }, [drawParticles, startAnimation, stepParticles]);

  animationStepRef.current = runAnimationFrame;

  const updatePointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      const rect = event.currentTarget.getBoundingClientRect();
      const { overscan } = sizeRef.current;
      clearParticleFadeTimer();
      pointerRef.current = {
        x: event.clientX - rect.left + overscan,
        y: event.clientY - rect.top + overscan,
        active: true,
        restoreStartedAt: null
      };
      setIsActive(true);
      setIsParticleLayerVisible(true);
      setIsParticleLayerSettling(true);
      startAnimation();
    },
    [clearParticleFadeTimer, startAnimation]
  );

  const onPointerLeave = useCallback((): void => {
    clearParticleFadeTimer();
    beginParticleRestore();
    setIsActive(false);
    setIsParticleLayerVisible(false);
    setIsParticleLayerSettling(true);
    if (typeof window !== "undefined") {
      particleFadeTimerRef.current = window.setTimeout(() => {
        particleFadeTimerRef.current = null;
        setIsParticleLayerSettling(false);
      }, PARTICLE_LAYER_SETTLE_DURATION_MS);
    } else {
      setIsParticleLayerSettling(false);
    }
    startAnimation();
  }, [beginParticleRestore, clearParticleFadeTimer, startAnimation]);

  const onFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>): void => {
      const relatedTarget = event.relatedTarget;
      if (
        relatedTarget instanceof Node &&
        event.currentTarget.contains(relatedTarget)
      ) {
        return;
      }

      const { width, height } = sizeRef.current;
      clearParticleFadeTimer();
      pointerRef.current = {
        x: width / 2,
        y: height / 2,
        active: true,
        restoreStartedAt: null
      };
      setIsActive(true);
      setIsParticleLayerVisible(true);
      setIsParticleLayerSettling(true);
      startAnimation();
    },
    [clearParticleFadeTimer, startAnimation]
  );

  const onBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>): void => {
      const relatedTarget = event.relatedTarget;
      if (
        relatedTarget instanceof Node &&
        event.currentTarget.contains(relatedTarget)
      ) {
        return;
      }
      clearParticleFadeTimer();
      beginParticleRestore();
      setIsActive(false);
      setIsParticleLayerVisible(false);
      setIsParticleLayerSettling(true);
      if (typeof window !== "undefined") {
        particleFadeTimerRef.current = window.setTimeout(() => {
          particleFadeTimerRef.current = null;
          setIsParticleLayerSettling(false);
        }, PARTICLE_LAYER_SETTLE_DURATION_MS);
      } else {
        setIsParticleLayerSettling(false);
      }
      startAnimation();
    },
    [beginParticleRestore, clearParticleFadeTimer, startAnimation]
  );

  useEffect(() => {
    buildParticles();
    if (shouldAnimateParticles) {
      startAnimation();
    } else {
      cancelAnimation();
    }
    if (!containerRef.current || typeof ResizeObserver === "undefined") {
      return () => {
        generationRef.current += 1;
        clearParticleFadeTimer();
        cancelAnimation();
      };
    }

    const observer = new ResizeObserver(() => {
      buildParticles();
      if (shouldAnimateParticles) {
        startAnimation();
      }
    });
    observer.observe(containerRef.current);

    return () => {
      generationRef.current += 1;
      clearParticleFadeTimer();
      observer.disconnect();
      cancelAnimation();
    };
  }, [
    buildParticles,
    cancelAnimation,
    clearParticleFadeTimer,
    shouldAnimateParticles,
    startAnimation
  ]);

  const combinedClassName = className
    ? `agent-gui-pixel-card ${className}`
    : "agent-gui-pixel-card";

  return (
    <div
      ref={containerRef}
      className={combinedClassName}
      data-active={isActive ? "true" : "false"}
      data-particle-visible={isParticleLayerShown ? "true" : "false"}
      data-static-image={hasStaticImage ? "true" : "false"}
      style={style}
      onPointerEnter={updatePointer}
      onPointerMove={updatePointer}
      onPointerLeave={onPointerLeave}
      onFocus={finalNoFocus ? undefined : onFocus}
      onBlur={finalNoFocus ? undefined : onBlur}
      tabIndex={finalNoFocus ? -1 : 0}
    >
      <span aria-hidden="true" className="agent-gui-pixel-card__hit-area" />
      {shouldRenderStaticImage && imageSrc ? (
        <img
          aria-hidden="true"
          className="agent-gui-pixel-card__image"
          draggable={false}
          src={imageSrc}
          alt=""
        />
      ) : null}
      <canvas className="agent-gui-pixel-card__canvas" ref={canvasRef} />
      {children}
    </div>
  );
}
