function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
export const SURFACE_PRESET_OPTIONS = [
  { value: "matte", label: "Matte" },
  { value: "glossy", label: "Glossy" },
  { value: "chrome", label: "Chrome" },
  { value: "cat-eye", label: "Cat Eye" },
  { value: "holographic", label: "Holographic" },
];
// ---- Compact serialization ----
// Stored shape examples:
//   {"p":"glossy"}
//   {"p":"cat-eye"}
//   {"p":"glossy","so":0.9}                          // shine opacity override
//   {"p":"chrome","ri":0.4}                          // reflection intensity override
//   {"p":"holographic","rb":true}                    // rainbow toggle override
// Preset defaults fill in everything else on read.

const PRESET_DEFAULTS = {
  matte: { shineOpacity: 0.08, reflection: 0, specular: 0, roughness: 0.9 },
  glossy: { shineOpacity: 0.6, reflection: 0.5, specular: 0.4, roughness: 0.3 },
  chrome: { shineOpacity: 0.8, reflection: 0.9, specular: 0.8, roughness: 0.15 },
  "cat-eye": { shineOpacity: 0.4, reflection: 0.4, specular: 0.35, roughness: 0.35 },
  holographic: { shineOpacity: 0.7, reflection: 0.55, specular: 0.45, roughness: 0.25 },
};

// Legacy DB values → canonical preset
const LEGACY_TYPE_MAP = {
  cateye: "cat-eye",
  cateyes: "cat-eye",
  "cat-eye": "cat-eye",
  matte: "matte",
  glossy: "glossy",
  chrome: "chrome",
  holographic: "holographic",
};

function presetDefaults(preset) {
  return PRESET_DEFAULTS[preset] || PRESET_DEFAULTS.glossy;
}

// Round to 2 decimals so we don't store 0.30000000000000004
function r2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export function buildShaderParamFromControls(controls) {
  const preset = String(controls?.surfacePreset || "glossy").trim() || "glossy";
  const def = presetDefaults(preset);

  // Store only what differs from preset defaults
  const param = { p: preset };

  const shineOpacity = r2(clamp(Number(controls?.shineOpacity ?? def.shineOpacity), 0, 1));
  if (Math.abs(shineOpacity - def.shineOpacity) > 0.005) {
    param.so = shineOpacity;
    if (!controls?.shineEnabled) param.sx = 1; // shine explicitly off
  } else if (!controls?.shineEnabled && preset !== "matte") {
    param.sx = 1;
  }

  const reflection = r2(clamp(Number(controls?.reflectionIntensity ?? def.reflection), 0, 1));
  if (Math.abs(reflection - def.reflection) > 0.005) param.ri = reflection;
  if (!controls?.reflectionEnabled && def.reflection > 0) param.rx = 1;

  const specular = r2(clamp(Number(controls?.specularIntensity ?? def.specular), 0, 1));
  if (Math.abs(specular - def.specular) > 0.005) param.si = specular;
  if (!controls?.specularEnabled && def.specular > 0) param.sxc = 1;

  const roughness = r2(clamp(Number(controls?.roughness ?? def.roughness), 0, 1));
  if (Math.abs(roughness - def.roughness) > 0.005) param.rg = roughness;

  // Toggles that deviate from the preset's natural state
  const presetHasStripe = preset === "cat-eye";
  if (Boolean(controls?.stripeEnabled) !== presetHasStripe) {
    param.st = controls?.stripeEnabled ? 1 : 0;
  }
  const presetHasRainbow = preset === "holographic";
  if (Boolean(controls?.rainbowEnabled) !== presetHasRainbow) {
    param.rb = controls?.rainbowEnabled ? 1 : 0;
  }
  const presetHasMetal = preset === "chrome";
  if (Boolean(controls?.metalnessEnabled) !== presetHasMetal) {
    param.mt = controls?.metalnessEnabled ? 1 : 0;
  }

  return JSON.stringify(param);
}

export function parseShaderParamToControls(shaderParam, surface = {}) {
  const parsed = (() => {
    if (!shaderParam) return {};
    if (typeof shaderParam === "object") return shaderParam;

    const trimmed = String(shaderParam).trim();
    if (!trimmed) return {};

    // Legacy plain string, e.g. "glossy"
    if (!trimmed.startsWith("{")) return { __legacyPreset: trimmed.toLowerCase() };

    try {
      return JSON.parse(trimmed);
    } catch {
      return { __legacyPreset: trimmed.toLowerCase() };
    }
  })();

  // ---- Detect preset ----
  let preset = "glossy";

  if (parsed?.p && LEGACY_TYPE_MAP[String(parsed.p).toLowerCase()]) {
    // New compact format
    preset = LEGACY_TYPE_MAP[String(parsed.p).toLowerCase()];
  } else if (parsed?.__legacyPreset && LEGACY_TYPE_MAP[parsed.__legacyPreset]) {
    // Bare string
    preset = LEGACY_TYPE_MAP[parsed.__legacyPreset];
  } else {
    // Legacy nested formats
    const rawType = String(parsed?.texture?.type || "").toLowerCase();
    const mappedType = LEGACY_TYPE_MAP[rawType];

    const hasStripe =
      Boolean(parsed?.stripe?.enabled) ||
      rawType.includes("cateye") ||
      rawType.includes("cat-eye");

    const hasRainbow =
      Boolean(
        parsed?.rainbow?.enabled ||
        parsed?.prism?.enabled ||
        parsed?.iridescence?.enabled,
      ) || parsed?.rainbow === true;

    const hasMetal =
      Boolean(parsed?.metalness?.enabled) ||
      Number(parsed?.metallic) > 0.5 ||
      Number(parsed?.reflectivity) > 0.7;

    const isMatte =
      rawType.includes("matte") || parsed?.shine?.enabled === false;

    if (mappedType) preset = mappedType;
    else if (isMatte) preset = "matte";
    else if (hasMetal) preset = "chrome";
    else if (hasStripe) preset = "cat-eye";
    else if (hasRainbow) preset = "holographic";
  }

  const def = presetDefaults(preset);

  // ---- Build controls ----
  // New compact keys take priority; legacy fallbacks fill the rest.

  const shineOpacity = Number(
    parsed?.so ??
    parsed?.shine?.opacity ??
    def.shineOpacity,
  );

  const reflectionIntensity = Number(
    parsed?.ri ??
    parsed?.reflection?.intensity ??
    def.reflection,
  );

  const specularIntensity = Number(
    parsed?.si ??
    parsed?.specular?.intensity ??
    def.specular,
  );

  const roughness = Number(
    parsed?.rg ??
    parsed?.texture?.roughness ??
    def.roughness,
  );

  const shineEnabled =
    parsed?.sx === 1
      ? false
      : parsed?.shine?.enabled !== undefined
        ? parsed?.shine?.enabled !== false
        : def.shineOpacity > 0;

  const reflectionEnabled =
    parsed?.rx === 1
      ? false
      : parsed?.reflection?.enabled !== undefined
        ? Boolean(parsed?.reflection?.enabled)
        : def.reflection > 0;

  const specularEnabled =
    parsed?.sxc === 1
      ? false
      : parsed?.specular?.enabled !== undefined
        ? Boolean(parsed?.specular?.enabled)
        : def.specular > 0;

  const stripeEnabled =
    parsed?.st !== undefined
      ? parsed.st === 1
      : parsed?.stripe?.enabled !== undefined
        ? Boolean(parsed?.stripe?.enabled)
        : preset === "cat-eye";

  const rainbowEnabled =
    parsed?.rb !== undefined
      ? parsed.rb === 1
      : parsed?.rainbow?.enabled !== undefined || parsed?.rainbow === true
        ? true
        : preset === "holographic";

  const metalnessEnabled =
    parsed?.mt !== undefined
      ? parsed.mt === 1
      : parsed?.metalness?.enabled !== undefined
        ? Boolean(parsed?.metalness?.enabled)
        : preset === "chrome";

  return {
    name: String(surface?.name || "").trim(),
    surfacePreset: preset,
    shineEnabled,
    shineOpacity,
    reflectionEnabled,
    reflectionIntensity,
    specularEnabled,
    specularIntensity,
    metalnessEnabled,
    metalnessIntensity: Number(parsed?.metalness?.intensity ?? 0.9),
    stripeEnabled,
    stripeOpacity: Number(parsed?.stripe?.opacity ?? 0.4),
    rainbowEnabled,
    rainbowIntensity: Number(
      parsed?.rainbow?.intensity ?? parsed?.iridescence?.intensity ?? 0.6,
    ),
    roughness,
    maskDataUrl: parsed?.texture?.maskDataUrl || null,
    lightnessOffset: String(Number(surface?.lightnessOffset || 0)),
    saturationOffset: String(Number(surface?.saturationOffset || 0)),
    hueOffset: String(Number(surface?.hueOffset || 0)),
    price: String(surface?.price ?? ""),
    duration: String(surface?.duration ?? ""),
  };
}

export function createEmptySurfaceForm() {
  const base = parseShaderParamToControls("", {});

  return {
    ...base,
    shaderParam: buildShaderParamFromControls(base),
    price: "",
    duration: "",
    lightnessOffset: "0",
    saturationOffset: "0",
    hueOffset: "0",
  };
}

export function syncSurfaceForm(nextDraft) {
  return {
    ...nextDraft,
    shaderParam: buildShaderParamFromControls(nextDraft),
  };
}

export function buildSurfacePayload(formValues) {
  const synced = syncSurfaceForm(formValues);

  return {
    name: String(synced?.name || "").trim(),
    status: "Active",
    shaderParam: synced.shaderParam,
    lightnessOffset: Number(synced?.lightnessOffset || 0),
    saturationOffset: Number(synced?.saturationOffset || 0),
    hueOffset: Number(synced?.hueOffset || 0),
    price: Number(synced?.price || 0),
    duration: Number(synced?.duration || 0),
  };
}