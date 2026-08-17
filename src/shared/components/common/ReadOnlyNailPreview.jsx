import { Sparkles } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { PropTypes } from "../../utils/propTypes";

const NAIL_LABELS = ["Thumb", "Index", "Middle", "Ring", "Pinky"];
const DEFAULT_SHAPE_RATIO = 0.42;

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
      posX: Number(item?.posX ?? 0),
      posY: Number(item?.posY ?? 0),
      componentType: String(item?.component?.componentType || item?.componentType || "").trim(),
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




function ReadOnlyNailCard({ components, index, colorStyle, shapeImageUrl, compact = false }) {
  const label = NAIL_LABELS[index];

  const shapeMaskStyle = shapeImageUrl
    ? {
      maskImage: `url(${shapeImageUrl})`,
      WebkitMaskImage: `url(${shapeImageUrl})`,
      maskSize: "cover",
      WebkitMaskSize: "cover",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }
    : {};

  const getFingerAlignmentClass = (label) => {
    if (compact) {
      switch (label) {
        case "Thumb":
          return "translate-y-5 -rotate-12";
        case "Index":
          return "translate-y-1 -rotate-3";
        case "Middle":
          return "translate-y-0 rotate-0";
        case "Ring":
          return "translate-y-0.5 rotate-3";
        case "Pinky":
          return "translate-y-4 rotate-8";
        default:
          return "";
      }
    }
    switch (label) {
      case "Thumb":
        return "translate-y-8 -rotate-12";
      case "Index":
        return "translate-y-2 -rotate-3";
      case "Middle":
        return "translate-y-0 rotate-0";
      case "Ring":
        return "translate-y-1 rotate-3";
      case "Pinky":
        return "translate-y-6 rotate-8";
      default:
        return "";
    }
  };

  const isClippedType = (type) => {
    const t = String(type || "").toLowerCase().trim();
    return t === "sticker" || t === "art" || t === "1" || t === "3";
  };

  return (
    <div className={`flex flex-col items-center transition-all duration-500 ease-out ${compact ? "gap-2" : "gap-3.5"} ${getFingerAlignmentClass(label)}`}>
      <div className="relative group">
        <div className="absolute -inset-1 rounded-t-[36px] rounded-b-[18px] bg-gradient-to-t from-[#ea4f93]/15 to-[#ffb8d9]/5 opacity-30 blur-md transition duration-500 group-hover:opacity-60 group-hover:blur-lg" />

        {/* Nail card — scaled based on compact mode */}
        <div className={`relative overflow-visible border-2 border-[#fcd5e6] bg-gradient-to-b from-[#fff6f9] to-[#ffeef5] shadow-[0_12px_28px_rgba(236,72,153,0.06)] transition-all duration-300 group-hover:scale-105 group-hover:border-[#ea4f93] ${compact ? "h-28 w-14 rounded-t-[20px] rounded-b-[10px]" : "h-48 w-24 rounded-t-[32px] rounded-b-[14px]"
          }`}>

          {/* Masked section for background and Art type components */}
          <div className="absolute inset-0 h-full w-full overflow-hidden" style={shapeMaskStyle}>
            <div className="absolute inset-0 h-full w-full" style={colorStyle} />

            {shapeImageUrl ? (
              <img
                crossOrigin="anonymous"
                src={shapeImageUrl}
                alt="shape mask overlay"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            ) : null}

            {components.map((componentItem, idx) => {
              if (!componentItem.imageUrl || !isClippedType(componentItem.componentType || componentItem.type)) return null;

              const displaySizePercent = (Number(componentItem.scale) || 0.8) * 2.5 * 100;
              const rotation = Number(componentItem.rotation) || 0;

              return (
                <img
                  key={`${componentItem.key}-${idx}`}
                  crossOrigin="anonymous"
                  src={componentItem.imageUrl}
                  alt={componentItem.label}
                  className="pointer-events-none absolute object-contain drop-shadow-[0_6px_10px_rgba(234,79,147,0.18)]"
                  referrerPolicy="no-referrer"
                  style={{
                    left: `${50 + Number(componentItem.posX || 0) * 100}%`,
                    top: `${50 + Number(componentItem.posY || 0) * 100}%`,
                    width: `${displaySizePercent}%`,
                    height: `${displaySizePercent}%`,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  }}
                />
              );
            })}
          </div>

          {/* Unmasked section for Gen type components */}
          <div className="absolute inset-0 h-full w-full pointer-events-none overflow-visible">
            {components.map((componentItem, idx) => {
              if (!componentItem.imageUrl || isClippedType(componentItem.componentType || componentItem.type)) return null;

              const displaySizePercent = (Number(componentItem.scale) || 0.8) * 2.5 * 100;
              const rotation = Number(componentItem.rotation) || 0;

              return (
                <img
                  key={`${componentItem.key}-${idx}`}
                  crossOrigin="anonymous"
                  src={componentItem.imageUrl}
                  alt={componentItem.label}
                  className="pointer-events-none absolute object-contain drop-shadow-[0_6px_10px_rgba(234,79,147,0.18)]"
                  referrerPolicy="no-referrer"
                  style={{
                    left: `${50 + Number(componentItem.posX || 0) * 100}%`,
                    top: `${50 + Number(componentItem.posY || 0) * 100}%`,
                    width: `${displaySizePercent}%`,
                    height: `${displaySizePercent}%`,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
      <span className={`rounded-full border border-[#fce6f3] bg-white/90 font-extrabold uppercase tracking-[0.14em] text-[#ea4f93] shadow-[0_6px_16px_rgba(236,72,153,0.06)] ${compact ? "text-[8px] px-2 py-0.5" : "text-[10px] px-3 py-1"
        }`}>
        {label}
      </span>
    </div>
  );
}

ReadOnlyNailCard.propTypes = {
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
  compact = false,
}) {
  const fingerColorConfigs = buildFingerColorConfigs(variantDetail?.colorJson);
  const componentPlacements = buildComponentPlacements(variantDetail?.nailComponents);
  const shapeImageUrl = String(variantDetail?.nailShape?.imageUrl || "").trim();
  const finishLabel = String(variantDetail?.nailSurface?.name).trim();

  return (
    <article className={`flex w-full max-w-full flex-col rounded-[24px] border border-[#f6dbe8] bg-[#fff7fb] shadow-[0_14px_30px_rgba(236,72,153,0.05)] ${className}`}>
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

        <div className={`${showInstruction || showSurfaceMode ? "mt-3" : ""} inline-flex max-w-full items-end ${compact ? "gap-2 py-4 px-2" : "gap-[18px] py-8 px-4"} overflow-visible justify-center w-full`}>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={NAIL_LABELS[index]} className="flex min-w-0 justify-center overflow-visible">
              <ReadOnlyNailCard
                index={index}
                colorStyle={getColorStyle(fingerColorConfigs[index])}
                components={componentPlacements.filter((item) => item.fingerIndex === index)}
                shapeImageUrl={shapeImageUrl}
                compact={compact}
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
  compact: PropTypes.bool,
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
