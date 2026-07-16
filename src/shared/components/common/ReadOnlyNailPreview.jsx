import { Canvas, FabricImage, Rect } from "fabric";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PropTypes } from "../../utils/propTypes";

const NAIL_LABELS = ["Thumb", "Index", "Middle", "Ring", "Pinky"];
const DEFAULT_SHAPE_RATIO = 0.42;
const COMPACT_FINGER_HEIGHTS = [78, 78, 78, 78, 78];
const FABRIC_CROSS_ORIGIN_OPTIONS = { crossOrigin: "anonymous" };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isHexColor(value) {
  return /^#([\da-f]{3}|[\da-f]{6})$/i.test(String(value || "").trim());
}

function normalizeColorValue(value, fallback = "#f7bdd7") {
  const normalized = String(value || "").trim();

  if (isHexColor(normalized)) {
    return normalized;
  }

  return fallback;
}

function normalizeGradientStops(gradientStops, primaryColor, secondaryColor) {
  const normalizedStops = (Array.isArray(gradientStops) ? gradientStops : [])
    .map((value) => normalizeColorValue(value, ""))
    .filter(Boolean);

  if (normalizedStops.length >= 2) {
    return normalizedStops;
  }

  return [
    normalizeColorValue(primaryColor, "#f7bdd7"),
    normalizeColorValue(secondaryColor || primaryColor, "#fce7f3"),
  ];
}

function normalizeFingerIndex(value) {
  const normalized = Number(value);

  if (normalized === -1) {
    return -1;
  }

  if (!Number.isInteger(normalized)) {
    return 0;
  }

  if (normalized >= 1 && normalized <= 5) {
    return normalized - 1;
  }

  return clamp(normalized, 0, 4);
}

function parsePlacementConfig(configJson) {
  try {
    const parsed = typeof configJson === "string" ? JSON.parse(configJson) : configJson;

    return {
      scale: Number(parsed?.scale ?? 0.8),
      rotation: Number(parsed?.rotation ?? 0),
      zIndex: Number(parsed?.zIndex ?? 10),
    };
  } catch {
    return {
      scale: 0.8,
      rotation: 0,
      zIndex: 10,
    };
  }
}

function parseVariantColorJson(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function useShapeAspectRatio(shapeImageUrl) {
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_SHAPE_RATIO);

  useEffect(() => {
    if (!shapeImageUrl) {
      return undefined;
    }

    let isCancelled = false;
    const image = new window.Image();
    image.referrerPolicy = "no-referrer";
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (isCancelled) return;
      const nextRatio = image.naturalWidth && image.naturalHeight
        ? image.naturalWidth / image.naturalHeight
        : DEFAULT_SHAPE_RATIO;
      setAspectRatio(clamp(nextRatio, 0.24, 0.82));
    };
    image.onerror = () => {
      if (!isCancelled) {
        setAspectRatio(DEFAULT_SHAPE_RATIO);
      }
    };
    image.src = shapeImageUrl;

    return () => {
      isCancelled = true;
    };
  }, [shapeImageUrl]);

  return shapeImageUrl ? aspectRatio : DEFAULT_SHAPE_RATIO;
}

function buildFingerColorConfigs(colorJson) {
  const fallbackPrimary = "#f7bdd7";
  const fallbackSecondary = "#fce7f3";
  const parsed = parseVariantColorJson(colorJson);
  const defaults = Array.from({ length: NAIL_LABELS.length }, () => ({
    mode: "solid",
    primaryColor: fallbackPrimary,
    secondaryColor: fallbackSecondary,
    gradientStops: [fallbackPrimary, fallbackSecondary],
  }));

  if (!parsed) {
    return defaults;
  }

  const gradientStops = Array.isArray(parsed?.gradient?.stops)
    ? parsed.gradient.stops.filter(Boolean)
    : [];
  const sharedColor = {
    mode: parsed?.mode === "gradient" && gradientStops.length >= 2 ? "gradient" : "solid",
    primaryColor: normalizeColorValue(parsed?.primaryColor || parsed?.color || gradientStops[0], fallbackPrimary),
    secondaryColor: normalizeColorValue(
      parsed?.secondaryColor || gradientStops[1] || gradientStops[0] || parsed?.primaryColor,
      fallbackSecondary,
    ),
    gradientStops: normalizeGradientStops(
      gradientStops,
      parsed?.primaryColor || parsed?.color || gradientStops[0],
      parsed?.secondaryColor || gradientStops[1] || gradientStops[0] || parsed?.primaryColor,
    ),
  };

  if (parsed?.mode !== "perFinger" || !Array.isArray(parsed?.fingers)) {
    return defaults.map(() => ({ ...sharedColor }));
  }

  const nextConfigs = defaults.map(() => ({ ...sharedColor }));

  parsed.fingers.forEach((finger) => {
    const fingerIndex = normalizeFingerIndex(finger?.fingerIndex);

    if (fingerIndex < 0) {
      return;
    }

    const fingerStops = Array.isArray(finger?.gradient?.stops)
      ? finger.gradient.stops.filter(Boolean)
      : [];
    nextConfigs[fingerIndex] = {
      mode: finger?.mode === "gradient" && fingerStops.length >= 2 ? "gradient" : "solid",
      primaryColor: normalizeColorValue(
        finger?.primaryColor || finger?.color || fingerStops[0],
        sharedColor.primaryColor,
      ),
      secondaryColor: normalizeColorValue(
        finger?.secondaryColor || fingerStops[1] || fingerStops[0] || finger?.primaryColor,
        sharedColor.secondaryColor,
      ),
      gradientStops: normalizeGradientStops(
        fingerStops,
        finger?.primaryColor || finger?.color || fingerStops[0],
        finger?.secondaryColor || fingerStops[1] || fingerStops[0] || finger?.primaryColor,
      ),
    };
  });

  return nextConfigs;
}

function buildComponentPlacements(nailComponents = []) {
  const placements = [];

  (Array.isArray(nailComponents) ? nailComponents : []).forEach((item, index) => {
    const basePlacement = {
      key: String(
        item?.nailComponentId
        || item?.customerNailComponentId
        || item?.componentId
        || `${item?.component?.name || "component"}-${index}`,
      ),
      label: String(item?.component?.name || item?.name || "Component").trim(),
      imageUrl: String(item?.component?.imageUrl || item?.imageUrl || "").trim(),
      posX: Number(item?.posX ?? 50),
      posY: Number(item?.posY ?? 52),
      ...parsePlacementConfig(item?.configJson),
    };
    const fingerIndex = normalizeFingerIndex(item?.fingerIndex);

    if (fingerIndex === -1) {
      NAIL_LABELS.forEach((_, currentFingerIndex) => {
        placements.push({
          ...basePlacement,
          key: `${basePlacement.key}-${currentFingerIndex}`,
          fingerIndex: currentFingerIndex,
        });
      });
      return;
    }

    placements.push({
      ...basePlacement,
      fingerIndex,
    });
  });

  return placements;
}

function getColorStyle(colorConfig) {
  if (colorConfig?.mode === "gradient") {
    const gradientFormula = normalizeGradientStops(
      colorConfig?.gradientStops,
      colorConfig?.primaryColor,
      colorConfig?.secondaryColor,
    )
      .map((color, index, stops) => `${color} ${((index / Math.max(stops.length - 1, 1)) * 100).toFixed(2)}%`)
      .join(", ");

    return {
      backgroundImage: `linear-gradient(135deg, ${gradientFormula})`,
    };
  }

  return {
    backgroundColor: colorConfig?.primaryColor || "#f7bdd7",
  };
}

function getNailMetrics(index, aspectRatio) {
  const nailHeight = COMPACT_FINGER_HEIGHTS[index] ?? COMPACT_FINGER_HEIGHTS[2];
  const nailWidth = Math.round(nailHeight * aspectRatio);
  const frameWidth = clamp(nailWidth + 52, 94, 146);
  const frameHeight = clamp(nailHeight + 72, 136, 196);

  return {
    nailHeight,
    nailWidth,
    frameWidth,
    frameHeight,
  };
}

function getPlacementRenderScale(scale, nailHeight) {
  const normalizedScale = Number(scale) || 0.8;
  const referenceHeight = 168;
  return normalizedScale * (nailHeight / referenceHeight);
}

function getShapeInsets(width, shapeImageUrl) {
  if (!shapeImageUrl) {
    return { innerInset: 0 };
  }

  return width > 88 ? { innerInset: 9 } : { innerInset: 7 };
}

function getContentMetrics(width, height, shapeImageUrl) {
  const { innerInset } = getShapeInsets(width, shapeImageUrl);

  return {
    innerInset,
    contentLeft: innerInset,
    contentTop: innerInset,
    contentWidth: Math.max(width - (innerInset * 2), 1),
    contentHeight: Math.max(height - (innerInset * 2), 1),
  };
}

function NailShell({ colorStyle, index, shapeImageUrl, children }) {
  const aspectRatio = useShapeAspectRatio(shapeImageUrl);
  const metrics = getNailMetrics(index, aspectRatio);
  const { frameWidth, frameHeight } = metrics;
  const { innerInset } = getShapeInsets(frameWidth, shapeImageUrl);
  const maskStyle = shapeImageUrl
    ? {
      maskImage: `url(${shapeImageUrl})`,
      WebkitMaskImage: `url(${shapeImageUrl})`,
      maskSize: "100% 100%",
      WebkitMaskSize: "100% 100%",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }
    : {};

  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center overflow-visible drop-shadow-[0_14px_22px_rgba(236,72,153,0.10)]"
        style={{ width: frameWidth, height: frameHeight }}
      >
        {shapeImageUrl ? (
          <>
            <div
              className="absolute bg-[linear-gradient(180deg,#ffd5e6_0%,#f6a8c9_100%)]"
              style={{
                inset: Math.max(2, innerInset - 3),
                ...maskStyle,
              }}
            />
            <div
              className="absolute bg-[linear-gradient(180deg,#fff7fb_0%,#fff1f8_100%)]"
              style={{
                inset: innerInset,
                ...maskStyle,
              }}
            />
          </>
        ) : null}

        <div
          className={shapeImageUrl
            ? "absolute"
            : "relative overflow-hidden rounded-t-[1.9rem] rounded-b-[0.9rem] border-2 border-[#f7cadd] bg-[linear-gradient(180deg,#fff7fb_0%,#fff1f8_100%)]"}
          style={shapeImageUrl ? { inset: innerInset, ...maskStyle } : { width: frameWidth, height: frameHeight }}
        >
          <div className="absolute inset-0" style={colorStyle} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.4),transparent_42%)]" />
          {shapeImageUrl ? (
            <img
              src={shapeImageUrl}
              alt={`${NAIL_LABELS[index]} nail shape`}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-multiply"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}
        </div>

        <div className="absolute inset-0 z-10">{children}</div>
      </div>

      <span className="rounded-full border border-[#fce6f3] bg-white/90 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#ea4f93] shadow-[0_6px_16px_rgba(236,72,153,0.06)]">
        {NAIL_LABELS[index]}
      </span>
    </div>
  );
}

NailShell.propTypes = {
  children: PropTypes.node,
  colorStyle: PropTypes.shape({}).isRequired,
  index: PropTypes.number.isRequired,
  shapeImageUrl: PropTypes.string,
};

function ReadOnlyFabricNailCanvas({ components, index, colorStyle, shapeImageUrl }) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const aspectRatio = useShapeAspectRatio(shapeImageUrl);
  const metrics = useMemo(() => getNailMetrics(index, aspectRatio), [aspectRatio, index]);
  const contentMetrics = useMemo(
    () => getContentMetrics(metrics.frameWidth, metrics.frameHeight, shapeImageUrl),
    [metrics.frameHeight, metrics.frameWidth, shapeImageUrl],
  );

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    const canvas = new Canvas(canvasRef.current, {
      width: metrics.frameWidth,
      height: metrics.frameHeight,
      preserveObjectStacking: true,
      selection: false,
      backgroundColor: "transparent",
    });

    fabricCanvasRef.current = canvas;

    const rect = new Rect({
      left: 0,
      top: 0,
      width: metrics.frameWidth,
      height: metrics.frameHeight,
      fill: "transparent",
      selectable: false,
      evented: false,
    });
    canvas.add(rect);
    canvas.sendObjectToBack(rect);

    return () => {
      fabricCanvasRef.current = null;
      canvas.dispose();
    };
  }, [metrics.frameHeight, metrics.frameWidth]);

  useEffect(() => {
    let isCancelled = false;

    const renderObjects = async () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      canvas.getObjects().forEach((object) => {
        if (object.type !== "rect") {
          canvas.remove(object);
        }
      });

      const sortedComponents = [...components].sort(
        (left, right) => Number(left.zIndex || 0) - Number(right.zIndex || 0),
      );

      for (const component of sortedComponents) {
        if (!component.imageUrl) continue;

        try {
          const image = await FabricImage.fromURL(component.imageUrl, FABRIC_CROSS_ORIGIN_OPTIONS);
          if (isCancelled) return;

          image.set({
            left: contentMetrics.contentLeft + ((Number(component.posX || 50) / 100) * contentMetrics.contentWidth),
            top: contentMetrics.contentTop + ((Number(component.posY || 52) / 100) * contentMetrics.contentHeight),
            originX: "center",
            originY: "center",
            angle: Number(component.rotation) || 0,
            scaleX: getPlacementRenderScale(component.scale, metrics.nailHeight),
            scaleY: getPlacementRenderScale(component.scale, metrics.nailHeight),
            selectable: false,
            evented: false,
          });

          const widthLimit = metrics.nailWidth * 1.42;
          if ((image.getScaledWidth() || 0) > widthLimit) {
            const ratio = widthLimit / image.getScaledWidth();
            image.scale((image.scaleX || 1) * ratio);
          }

          canvas.add(image);
        } catch (error) {
          console.error("Unable to load nail component image:", error);
        }
      }

      canvas.renderAll();
    };

    void renderObjects();

    return () => {
      isCancelled = true;
    };
  }, [components, contentMetrics, metrics.nailHeight, metrics.nailWidth]);

  return (
    <NailShell
      index={index}
      colorStyle={colorStyle}
      shapeImageUrl={shapeImageUrl}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </NailShell>
  );
}

ReadOnlyFabricNailCanvas.propTypes = {
  colorStyle: PropTypes.shape({}).isRequired,
  components: PropTypes.arrayOf(
    PropTypes.shape({
      imageUrl: PropTypes.string,
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      posX: PropTypes.number.isRequired,
      posY: PropTypes.number.isRequired,
      rotation: PropTypes.number.isRequired,
      scale: PropTypes.number.isRequired,
      zIndex: PropTypes.number,
    }),
  ).isRequired,
  index: PropTypes.number.isRequired,
  shapeImageUrl: PropTypes.string,
};

export function ReadOnlyNailPreview({
  title = "Live Nail Preview",
  instruction = "Design preview generated from current nail data.",
  className = "",
  showHeader = true,
  showInstruction = true,
  showSurfaceMode = true,
  variantDetail,
}) {
  const fingerColorConfigs = buildFingerColorConfigs(variantDetail?.colorJson);
  const componentPlacements = buildComponentPlacements(variantDetail?.nailComponents);
  const shapeImageUrl = String(variantDetail?.nailShape?.imageUrl || "").trim();
  const finishLabel = String(variantDetail?.nailSurface?.name || "--").trim() || "--";

  return (
    <article className={`flex w-full max-w-full flex-col rounded-[24px] border border-[#f6dbe8] bg-[#fff7fb] p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)] ${className}`}>
      {showHeader ? (
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#ea4f93]" />
          <h3 className="text-xs font-extrabold text-[#ea4f93]">{title}</h3>
        </div>
      ) : null}

      <div className={`${showHeader ? "mt-4" : ""} rounded-[18px] bg-[linear-gradient(180deg,#fff3f9_0%,#ffeef7_100%)] p-4`}>
        {showSurfaceMode ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-[14px] bg-white/65 px-3 py-2 text-[10px] font-bold text-[#b07d97]">
            <span>Surface Mode</span>
            <span className="rounded-full bg-[#fff1f7] px-2.5 py-1 text-[#ea4f93]">
              {finishLabel}
            </span>
          </div>
        ) : null}

        {showInstruction ? (
          <div className="rounded-[14px] border border-dashed border-[#f2bfd4] bg-white/75 px-3 py-2 text-[10px] font-bold text-[#b07d97]">
            {instruction}
          </div>
        ) : null}

        <div className={`${showInstruction || showSurfaceMode ? "mt-3" : ""} inline-flex max-w-full items-end gap-[2px] overflow-visible px-0`}>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={NAIL_LABELS[index]} className="flex min-w-0 justify-center overflow-visible py-1">
              <ReadOnlyFabricNailCanvas
                index={index}
                colorStyle={getColorStyle(fingerColorConfigs[index])}
                components={componentPlacements.filter((item) => item.fingerIndex === index)}
                shapeImageUrl={shapeImageUrl}
              />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

ReadOnlyNailPreview.propTypes = {
  className: PropTypes.string,
  instruction: PropTypes.string,
  showHeader: PropTypes.bool,
  showInstruction: PropTypes.bool,
  showSurfaceMode: PropTypes.bool,
  title: PropTypes.string,
  variantDetail: PropTypes.shape({
    colorJson: PropTypes.string,
    nailComponents: PropTypes.arrayOf(
      PropTypes.shape({
        component: PropTypes.shape({
          imageUrl: PropTypes.string,
          name: PropTypes.string,
        }),
        componentId: PropTypes.number,
        configJson: PropTypes.string,
        fingerIndex: PropTypes.number,
        imageUrl: PropTypes.string,
        name: PropTypes.string,
        nailComponentId: PropTypes.number,
        posX: PropTypes.number,
        posY: PropTypes.number,
      }),
    ),
    nailShape: PropTypes.shape({
      imageUrl: PropTypes.string,
    }),
    nailSurface: PropTypes.shape({
      name: PropTypes.string,
    }),
  }),
};
