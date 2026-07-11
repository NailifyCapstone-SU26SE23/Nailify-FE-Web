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

function createPresetConfig(preset) {
  switch (preset) {
    case "matte":
      return {
        shine: { enabled: false },
        reflection: { enabled: false, intensity: 0 },
        specular: { enabled: false, intensity: 0 },
        texture: { type: "matte", roughness: 0.9 },
        lighting: { diffuse: 0.3, ambient: 0.7 },
      };
    case "chrome":
      return {
        shine: { enabled: true, position: "top-left", size: 0.6, opacity: 0.8, blur: 10 },
        reflection: { enabled: true, intensity: 0.9 },
        specular: { enabled: true, intensity: 0.8 },
        metalness: { enabled: true, intensity: 0.9 },
        environmentMap: { type: "studio", intensity: 0.7 },
        mirrorEffect: { enabled: true, distortion: 0.1 },
        texture: { type: "chrome", roughness: 0.15 },
      };
    case "cat-eye":
      return {
        shine: { enabled: true, position: "center", size: 0.3, opacity: 0.4, blur: 15 },
        reflection: { enabled: true, intensity: 0.4 },
        specular: { enabled: true, intensity: 0.35 },
        stripe: { enabled: true, position: "center", width: 60, opacity: 0.4, blur: 20, magneticEffect: 0.7 },
        gradient: { enabled: true, direction: "horizontal", intensity: 0.5 },
        texture: { type: "cat-eye", roughness: 0.35 },
      };
    case "holographic":
      return {
        shine: { enabled: true, position: "top-right", size: 0.5, opacity: 0.7, blur: 15 },
        reflection: { enabled: true, intensity: 0.55 },
        specular: { enabled: true, intensity: 0.45 },
        prism: {
          enabled: true,
          intensity: 0.5,
          angle: 45,
          colors: ["red", "orange", "yellow", "green", "blue", "indigo", "violet"],
        },
        iridescence: { enabled: true, intensity: 0.8, shiftSpeed: 1.5 },
        rainbow: { enabled: true, intensity: 0.6, angle: 30 },
        texture: { type: "holographic", roughness: 0.25 },
      };
    case "glossy":
    default:
      return {
        shine: { enabled: true, position: "top-right", size: 0.4, opacity: 0.6, blur: 20 },
        reflection: { enabled: true, intensity: 0.5 },
        specular: { enabled: true, intensity: 0.4 },
        texture: { type: "glossy", roughness: 0.3 },
      };
  }
}

export function buildShaderParamFromControls(controls) {
  const preset = String(controls?.surfacePreset || "glossy").trim() || "glossy";
  const config = createPresetConfig(preset);
  const shineOpacity = clamp(Number(controls?.shineOpacity ?? config?.shine?.opacity ?? 0), 0, 1);
  const reflectionIntensity = clamp(Number(controls?.reflectionIntensity ?? config?.reflection?.intensity ?? 0), 0, 1);
  const specularIntensity = clamp(Number(controls?.specularIntensity ?? config?.specular?.intensity ?? 0), 0, 1);
  const metalnessIntensity = clamp(Number(controls?.metalnessIntensity ?? config?.metalness?.intensity ?? 0), 0, 1);
  const roughness = clamp(Number(controls?.roughness ?? config?.texture?.roughness ?? 0.3), 0, 1);
  const stripeOpacity = clamp(Number(controls?.stripeOpacity ?? config?.stripe?.opacity ?? 0), 0, 1);
  const rainbowIntensity = clamp(Number(controls?.rainbowIntensity ?? config?.rainbow?.intensity ?? 0), 0, 1);

  config.texture = {
    ...(config.texture || {}),
    type: config?.texture?.type || preset,
    roughness,
  };

  config.shine = {
    ...(config.shine || {}),
    enabled: Boolean(controls?.shineEnabled),
    opacity: shineOpacity,
  };

  config.reflection = {
    ...(config.reflection || {}),
    enabled: Boolean(controls?.reflectionEnabled),
    intensity: reflectionIntensity,
  };

  config.specular = {
    ...(config.specular || {}),
    enabled: Boolean(controls?.specularEnabled),
    intensity: specularIntensity,
  };

  if (controls?.metalnessEnabled || preset === "chrome") {
    config.metalness = {
      ...(config.metalness || {}),
      enabled: Boolean(controls?.metalnessEnabled),
      intensity: metalnessIntensity,
    };
  } else {
    delete config.metalness;
    delete config.environmentMap;
    delete config.mirrorEffect;
  }

  if (controls?.stripeEnabled || preset === "cat-eye") {
    config.stripe = {
      ...(config.stripe || {}),
      enabled: Boolean(controls?.stripeEnabled),
      opacity: stripeOpacity,
    };
  } else {
    delete config.stripe;
    delete config.gradient;
  }

  if (controls?.rainbowEnabled || preset === "holographic") {
    config.rainbow = {
      ...(config.rainbow || {}),
      enabled: Boolean(controls?.rainbowEnabled),
      intensity: rainbowIntensity,
    };
    config.prism = {
      ...(config.prism || {}),
      enabled: true,
      intensity: clamp(rainbowIntensity * 0.85, 0.1, 1),
    };
    config.iridescence = {
      ...(config.iridescence || {}),
      enabled: true,
      intensity: clamp(rainbowIntensity, 0.15, 1),
    };
  } else {
    delete config.rainbow;
    delete config.prism;
    delete config.iridescence;
  }

  return JSON.stringify(config);
}

export function parseShaderParamToControls(shaderParam, surface = {}) {
  const parsed = (() => {
    try {
      return shaderParam ? JSON.parse(shaderParam) : {};
    } catch {
      return {};
    }
  })();

  const textureType = String(parsed?.texture?.type || "").toLowerCase();
  const hasMetalness = Boolean(parsed?.metalness?.enabled || parsed?.mirrorEffect?.enabled);
  const hasStripe = Boolean(parsed?.stripe?.enabled);
  const hasRainbow = Boolean(parsed?.rainbow?.enabled || parsed?.prism?.enabled || parsed?.iridescence?.enabled);
  const isMatte = textureType.includes("matte") || parsed?.shine?.enabled === false;

  let surfacePreset = "glossy";

  if (isMatte) {
    surfacePreset = "matte";
  } else if (hasMetalness) {
    surfacePreset = "chrome";
  } else if (hasStripe) {
    surfacePreset = "cat-eye";
  } else if (hasRainbow) {
    surfacePreset = "holographic";
  }

  return {
    name: String(surface?.name || "").trim(),
    surfacePreset,
    shineEnabled: parsed?.shine?.enabled !== false,
    shineOpacity: Number(parsed?.shine?.opacity ?? (surfacePreset === "matte" ? 0.08 : 0.6)),
    reflectionEnabled: Boolean(parsed?.reflection?.enabled),
    reflectionIntensity: Number(parsed?.reflection?.intensity ?? 0.5),
    specularEnabled: Boolean(parsed?.specular?.enabled),
    specularIntensity: Number(parsed?.specular?.intensity ?? 0.4),
    metalnessEnabled: hasMetalness,
    metalnessIntensity: Number(parsed?.metalness?.intensity ?? 0.9),
    stripeEnabled: hasStripe,
    stripeOpacity: Number(parsed?.stripe?.opacity ?? 0.4),
    rainbowEnabled: hasRainbow,
    rainbowIntensity: Number(parsed?.rainbow?.intensity ?? parsed?.iridescence?.intensity ?? 0.6),
    roughness: Number(parsed?.texture?.roughness ?? (isMatte ? 0.9 : 0.3)),
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
    shaderParam: synced.shaderParam,
    lightnessOffset: Number(synced?.lightnessOffset || 0),
    saturationOffset: Number(synced?.saturationOffset || 0),
    hueOffset: Number(synced?.hueOffset || 0),
    price: Number(synced?.price || 0),
    duration: Number(synced?.duration || 0),
  };
}
