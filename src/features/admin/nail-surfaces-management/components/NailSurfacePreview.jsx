import { PropTypes } from "../../../../shared/utils/propTypes";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseShaderParam(shaderParam) {
  const rawValue = String(shaderParam || "").trim();

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return {};
  }
}

function buildPreviewPalette(surface) {
  const config = parseShaderParam(surface?.shaderParam);
  const hue = Number(surface?.hueOffset || 0);
  const saturation = Number(surface?.saturationOffset || 0);
  const lightness = Number(surface?.lightnessOffset || 0);
  const textureType = String(config?.texture?.type || "").toLowerCase();
  const hasChrome = Boolean(config?.metalness?.enabled || config?.mirrorEffect?.enabled);
  const hasRainbow = Boolean(config?.rainbow?.enabled || config?.prism?.enabled || config?.iridescence?.enabled);
  const isMatte = textureType.includes("matte") || config?.shine?.enabled === false;

  const baseHue = 336 + hue;
  const baseSaturation = clamp(74 + saturation * 40, 8, 100);
  const baseLightness = clamp(65 + lightness * 30, 20, 92);
  const accentHue = baseHue + (hasRainbow ? 45 : hasChrome ? 18 : 0);
  const accentSaturation = clamp(baseSaturation + (hasChrome ? 10 : 0), 10, 100);
  const accentLightness = clamp(baseLightness + (isMatte ? -6 : 8), 16, 96);
  const depthLightness = clamp(baseLightness - (hasChrome ? 22 : 14), 8, 72);

  return {
    config,
    isMatte,
    hasChrome,
    hasRainbow,
    base: `hsl(${baseHue} ${baseSaturation}% ${baseLightness}%)`,
    accent: `hsl(${accentHue} ${accentSaturation}% ${accentLightness}%)`,
    depth: `hsl(${baseHue - 8} ${clamp(baseSaturation - 14, 6, 100)}% ${depthLightness}%)`,
  };
}

function getPreviewStyle(surface) {
  const palette = buildPreviewPalette(surface);
  const config = palette.config;
  const reflectionIntensity = clamp(Number(config?.reflection?.intensity || 0), 0, 1);
  const metalnessIntensity = clamp(Number(config?.metalness?.intensity || 0), 0, 1);
  const roughness = clamp(Number(config?.texture?.roughness ?? (palette.isMatte ? 0.9 : 0.3)), 0, 1);
  const prismIntensity = clamp(Number(config?.prism?.intensity || 0), 0, 1);

  let background = `linear-gradient(145deg, ${palette.accent} 0%, ${palette.base} 48%, ${palette.depth} 100%)`;
  let boxShadow = "inset 0 1px 0 rgba(255,255,255,0.75), 0 16px 30px rgba(67,39,68,0.12)";

  if (palette.hasChrome) {
    background = `linear-gradient(130deg, rgba(255,255,255,0.96) 0%, ${palette.accent} 18%, ${palette.base} 40%, ${palette.depth} 58%, rgba(255,255,255,0.92) 82%, ${palette.accent} 100%)`;
    boxShadow = "inset 0 1px 0 rgba(255,255,255,0.95), 0 16px 34px rgba(120,120,140,0.2)";
  } else if (palette.hasRainbow) {
    background = `linear-gradient(125deg, ${palette.base} 0%, #ff9ac7 22%, #ffd86f 42%, #9ae6ff 68%, #d5b3ff 100%)`;
  } else if (palette.isMatte) {
    background = `linear-gradient(160deg, ${palette.accent} 0%, ${palette.base} 55%, ${palette.depth} 100%)`;
    boxShadow = "0 12px 24px rgba(67,39,68,0.08)";
  }

  return {
    palette,
    tileStyle: {
      background,
      boxShadow,
      filter: `saturate(${clamp(1 + Number(surface?.saturationOffset || 0), 0.35, 2)}) brightness(${clamp(
        1 + Number(surface?.lightnessOffset || 0) * 0.4,
        0.7,
        1.5,
      )}) hue-rotate(${Number(surface?.hueOffset || 0)}deg)`,
    },
    shineStyle: {
      opacity: palette.isMatte ? 0.08 : clamp(0.24 + reflectionIntensity * 0.45 + metalnessIntensity * 0.2, 0.18, 0.88),
      background: palette.hasChrome
        ? "linear-gradient(115deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.18) 38%, rgba(255,255,255,0) 62%)"
        : "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.12) 48%, rgba(255,255,255,0) 100%)",
      filter: `blur(${palette.isMatte ? 6 : clamp(6 + (1 - roughness) * 18, 6, 24)}px)`,
    },
    sparkleStyle: {
      opacity: clamp(prismIntensity * 0.7 + (palette.hasRainbow ? 0.32 : 0), 0, 0.92),
    },
    stripeStyle: {
      opacity: config?.stripe?.enabled ? clamp(Number(config.stripe.opacity || 0.4), 0.1, 0.85) : 0,
    },
  };
}

export function NailSurfacePreview({ surface, compact = false }) {
  const { tileStyle, shineStyle, sparkleStyle, stripeStyle, palette } = getPreviewStyle(surface);
  const shellClassName = compact
    ? "relative h-16 w-10 overflow-hidden rounded-t-[18px] rounded-b-[10px] border border-white/70"
    : "relative h-36 w-24 overflow-hidden rounded-t-[34px] rounded-b-[16px] border border-white/80";

  return (
    <div className={compact ? "inline-flex items-center gap-3" : "rounded-[24px] border border-[#f7d7e5] bg-white p-4"}>
      <div className={compact ? "rounded-[18px] bg-[radial-gradient(circle_at_top,#fff6fb_0%,#fff2f8_100%)] p-2.5" : "rounded-[20px] bg-[radial-gradient(circle_at_top,#fff6fb_0%,#fff0f7_55%,#fff8fb_100%)] p-5"}>
        <div className="flex items-end gap-2">
          {Array.from({ length: compact ? 1 : 5 }).map((_, index) => (
            <div
              key={index}
              className={shellClassName}
              style={{
                ...tileStyle,
                transform: compact ? undefined : `translateY(${Math.abs(2 - index) * 10}px) rotate(${(index - 2) * 4}deg)`,
              }}
            >
              <div className="absolute inset-0 opacity-80" style={shineStyle} />
              <div
                className="absolute inset-0"
                style={{
                  opacity: stripeStyle.opacity,
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%)",
                  filter: "blur(8px)",
                  transform: "translateX(6%)",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  opacity: sparkleStyle.opacity,
                  background:
                    "linear-gradient(120deg, rgba(255,0,128,0.12) 8%, rgba(255,214,10,0.18) 28%, rgba(86,206,255,0.18) 50%, rgba(174,110,255,0.18) 72%, rgba(255,255,255,0.1) 100%)",
                  mixBlendMode: "screen",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 55%, ${palette.depth}88 100%)`,
                  mixBlendMode: "soft-light",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {!compact ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#432744]">{surface?.name || "Surface Preview"}</p>
            <p className="mt-1 text-xs text-[#9a7388]">Preview generated from `shaderParam` and color offsets.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

NailSurfacePreview.propTypes = {
  compact: PropTypes.bool,
  surface: PropTypes.shape({
    hueOffset: PropTypes.number,
    lightnessOffset: PropTypes.number,
    name: PropTypes.string,
    saturationOffset: PropTypes.number,
    shaderParam: PropTypes.string,
  }),
};

