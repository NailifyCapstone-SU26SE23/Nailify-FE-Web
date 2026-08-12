import {
  ChevronLeft,
  ChevronRight,
  Palette,
  Search,
  Star,
} from "lucide-react";
import { toBlob } from "html-to-image";
import toast from "react-hot-toast";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { axiosClient } from "../../../../lib/axiosClient";
import { loadAuthSession } from "../../../../features/core/auth/model/authStorage";
import { formatDurationLabel } from "../../../../shared/utils/formatDuration";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  getMockBookingById,
  getStaffDesignStudioExperienceById,
} from "../../../../shared/bookings/services/mockBookings";
import {
  createStaffCustomerNailComponent,
  createStaffCustomerNail,
  fetchStaffCustomerNailDetail,
  fetchStaffBookingDetail,
  fetchServiceCatalog,
  fetchStaffBuilderNailComponents,
  fetchStaffBuilderNailShapes,
  fetchStaffBuilderNailSurfaces,
  fetchStaffNailVariantDetail,
  updateStaffBooking,
} from "../services/staffBookingService";
import { InteractiveStudioPreview } from "../components/InteractiveStudioPreview";
import {
  getStaffBookingDetailRoute,
  ROUTES,
} from "../../../../shared/constants/routes";

const DEFAULT_DESIGN_IMAGE = "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=800&q=80";

function getAuthHeaders() {
  const session = loadAuthSession();
  const token = session?.accessToken || session?.token;

  return token
    ? {
      Authorization: `Bearer ${token}`,
    }
    : {};
}

function unwrapApiResponse(response, fallbackMessage) {
  const payload = response?.data;

  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload.data;
}

function formatCurrencyValue(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VND`;
}

function rgbToHex(rgbValue) {
  const normalized = String(rgbValue || "").trim();
  const matched = normalized.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);

  if (!matched) {
    return normalized || "#f8b4d9";
  }

  return `#${matched
    .slice(1)
    .map((value) => Number(value).toString(16).padStart(2, "0"))
    .join("")}`;
}

function hexToRgbLabel(hexValue) {
  const normalized = String(hexValue || "").trim().replace("#", "");

  if (!/^[\da-f]{6}$/i.test(normalized)) {
    return "RGB(248, 180, 217)";
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `RGB(${red}, ${green}, ${blue})`;
}

function normalizeGradientStops(stops, primaryColor, secondaryColor) {
  const normalizedStops = (Array.isArray(stops) ? stops : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (normalizedStops.length >= 2) {
    return normalizedStops;
  }

  return [
    String(primaryColor || "#f8b4d9").trim() || "#f8b4d9",
    String(secondaryColor || primaryColor || "#f3e8ff").trim() || "#f3e8ff",
  ];
}

function buildGradientStyle(gradientStops = []) {
  const normalizedStops = normalizeGradientStops(gradientStops);
  const gradientFormula = normalizedStops
    .map((color, index) => {
      if (normalizedStops.length === 1) {
        return `${color} 0%`;
      }

      const position = (index / (normalizedStops.length - 1)) * 100;
      return `${color} ${position.toFixed(2)}%`;
    })
    .join(", ");

  return `linear-gradient(135deg, ${gradientFormula})`;
}

function buildColorSummary(mode, primaryColor, secondaryColor) {
  if (mode === "gradient") {
    return `${hexToRgbLabel(primaryColor)} → ${hexToRgbLabel(secondaryColor)}`;
  }

  return hexToRgbLabel(primaryColor);
}

function createDefaultFingerColor(primaryColor = "#f8b4d9", secondaryColor = "#f3e8ff") {
  return {
    mode: "solid",
    primaryColor,
    secondaryColor,
  };
}

function normalizeFingerColorConfig(colorConfig) {
  const primaryColor = String(colorConfig?.primaryColor || "#f8b4d9").trim() || "#f8b4d9";
  const secondaryColor = String(colorConfig?.secondaryColor || primaryColor || "#f3e8ff").trim() || "#f3e8ff";
  const gradientStops = normalizeGradientStops(colorConfig?.gradientStops, primaryColor, secondaryColor);

  return {
    mode: colorConfig?.mode === "gradient" ? "gradient" : "solid",
    primaryColor: gradientStops[0],
    secondaryColor: gradientStops[1],
    gradientStops,
  };
}

function getFingerColorSummary(colorConfig) {
  const normalizedConfig = normalizeFingerColorConfig(colorConfig);

  return normalizedConfig.mode === "gradient"
    ? normalizedConfig.gradientStops.map((color) => hexToRgbLabel(color)).join(" -> ")
    : hexToRgbLabel(normalizedConfig.primaryColor);
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

  return Math.min(4, Math.max(0, normalized));
}

function parseVariantColorJson(colorJson, fallbackPrimaryColor, fallbackSecondaryColor) {
  const defaultFingerColors = Array.from({ length: NAIL_LABELS.length }, () =>
    createDefaultFingerColor(fallbackPrimaryColor, fallbackSecondaryColor),
  );

  if (!colorJson) {
    return defaultFingerColors;
  }

  try {
    const parsed = typeof colorJson === "string" ? JSON.parse(colorJson) : colorJson;

    if (parsed?.mode === "perFinger" && Array.isArray(parsed?.fingers)) {
      parsed.fingers.forEach((finger) => {
        const fingerIndex = normalizeFingerIndex(finger?.fingerIndex);

        if (fingerIndex < 0) {
          return;
        }

        const gradientStops = Array.isArray(finger?.gradient?.stops) ? finger.gradient.stops.filter(Boolean) : [];
        defaultFingerColors[fingerIndex] = normalizeFingerColorConfig({
          mode: gradientStops.length >= 2 ? "gradient" : "solid",
          primaryColor: String(finger?.primaryColor || finger?.color || gradientStops[0] || fallbackPrimaryColor),
          secondaryColor: String(
            finger?.secondaryColor
            || gradientStops[1]
            || gradientStops[0]
            || finger?.primaryColor
            || fallbackSecondaryColor,
          ),
          gradientStops,
        });
      });

      return defaultFingerColors;
    }

    const gradientStops = Array.isArray(parsed?.gradient?.stops) ? parsed.gradient.stops.filter(Boolean) : [];
    const sharedColor = normalizeFingerColorConfig({
      mode: parsed?.mode === "gradient" && gradientStops.length >= 2 ? "gradient" : "solid",
      primaryColor: String(parsed?.primaryColor || parsed?.color || gradientStops[0] || fallbackPrimaryColor),
      secondaryColor: String(
        parsed?.secondaryColor
        || gradientStops[1]
        || gradientStops[0]
        || parsed?.primaryColor
        || fallbackSecondaryColor,
      ),
      gradientStops,
    });

    return Array.from({ length: NAIL_LABELS.length }, () => ({ ...sharedColor }));
  } catch {
    return defaultFingerColors;
  }
}

function formatOptionMeta(option) {
  if (!option) {
    return "";
  }

  const meta = [];

  if (Number(option.price || 0) > 0) {
    meta.push(formatCurrencyValue(option.price));
  }

  if (Number(option.duration || 0) > 0) {
    meta.push(formatDurationLabel(option.duration));
  }

  return meta.join(" • ");
}

function buildDesignTemplateFromApi(item) {
  const imageUrl = String(item?.imageUrl || "").trim();
  const categories = Array.isArray(item?.categories) ? item.categories.map((category) => category?.name).filter(Boolean) : [];
  const firstVariant = Array.isArray(item?.nailVariants) ? item.nailVariants[0] : null;
  const duration = Number(firstVariant?.duration || 0);
  const minPrice = Number(item?.minPrice || 0);
  const maxPrice = Number(item?.maxPrice || 0);

  return {
    id: String(item?.nailDesignId ?? ""),
    name: String(item?.name || "Untitled design").trim(),
    image: imageUrl || DEFAULT_DESIGN_IMAGE,
    price: minPrice || maxPrice
      ? `${formatCurrencyValue(minPrice || maxPrice)}${minPrice !== maxPrice ? ` - ${formatCurrencyValue(maxPrice)}` : ""}`
      : "Contact for quote",
    duration: duration > 0 ? formatDurationLabel(duration) : "Flexible",
    tags: categories.length ? categories : ["Custom design"],
    accent: categories.length ? "Live" : "Ready",
    accentClassName: "rounded-md bg-[#fff1f7] px-2 py-1 text-[9px] font-extrabold text-[#ea4f93]",
    ctaLabel: "View variants",
    description: String(item?.description || "").trim(),
    raw: item,
  };
}

function buildVariantTemplateFromApi(item) {
  return {
    id: String(item?.nailVariantId ?? ""),
    name: String(item?.name || "Untitled variant").trim(),
    image: String(item?.imageUrl || DEFAULT_DESIGN_IMAGE),
    price: formatCurrencyValue(item?.price || 0),
    duration: Number(item?.duration || 0) > 0 ? formatDurationLabel(Number(item?.duration || 0)) : "Flexible",
    tags: [item?.nailShape?.name, item?.nailSurface?.name].filter(Boolean),
    raw: item,
  };
}

function buildShapeOption(item) {
  const rawLabel = String(item?.name || "--").trim();
  return {
    id: String(item?.nailShapeId || item?.id || item?.name || ""),
    label: rawLabel,
    familyLabel: getShapeFamilyLabel(rawLabel),
    lengthVariant: getShapeLengthVariant(rawLabel),
    imageUrl: String(item?.imageUrl || "").trim(),
    price: Number(item?.price || 0),
    duration: Number(item?.duration || 0),
  };
}

function buildSurfaceOption(item) {
  return {
    id: String(item?.nailSurfaceId || item?.id || item?.name || ""),
    label: String(item?.name || "--").trim(),
    shaderParam: String(item?.shaderParam || "").trim(),
    price: Number(item?.price || 0),
    duration: Number(item?.duration || 0),
  };
}

function buildDecorationOption(item) {
  return {
    id: String(item?.componentId || item?.id || item?.name || ""),
    label: String(item?.name || "--").trim(),
    imageUrl: String(item?.imageUrl || "").trim(),
    componentType: String(item?.componentType || "").trim(),
    price: Number(item?.price || 0),
    duration: Number(item?.duration || 0),
  };
}

function buildCustomerDecorationOption(item) {
  return {
    id: `customer-component-${item?.customerComponentId || item?.id || item?.name || ""}`,
    label: String(item?.name || "--").trim(),
    imageUrl: String(item?.imageUrl || "").trim(),
    componentType: String(item?.componentType || "").trim(),
    price: Number(item?.price || 0),
    duration: Number(item?.duration || 0),
    componentId: null,
    customerComponentId: Number(item?.customerComponentId || 0),
  };
}

function buildExtraServiceOption(item) {
  return {
    id: String(item?.serviceId || item?.id || item?.name || ""),
    label: String(item?.name || "--").trim(),
    description: String(item?.description || "").trim(),
    price: Number(item?.price || 0),
    duration: Number(item?.duration || 0),
  };
}

function getPresetColorHex(colorName) {
  const normalized = String(colorName || "").trim().toLowerCase();
  const presetMap = {
    nude: "#d6a77a",
    pink: "#f472b6",
    white: "#f8fafc",
    chrome: "#cbd5e1",
  };

  return presetMap[normalized] || "#f8b4d9";
}

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(String(value || "").trim());
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalizedValue = Number(value);

  return Number.isFinite(normalizedValue) && normalizedValue > 0 ? normalizedValue : null;
}

function toNullableUuid(value) {
  const normalizedValue = String(value || "").trim();

  return isUuidLike(normalizedValue) ? normalizedValue : null;
}

function getPrimaryNailVariantId(bookingItems) {
  const matchedItem = (Array.isArray(bookingItems) ? bookingItems : []).find((item) => {
    const variantId = Number(item?.nailVariantId || 0);
    return Number.isInteger(variantId) && variantId > 0;
  });

  return Number(matchedItem?.nailVariantId || 0);
}

function getPrimaryCustomerNailId(bookingItems) {
  const matchedItem = (Array.isArray(bookingItems) ? bookingItems : []).find((item) => {
    const customerNailId = Number(item?.customerNailId || 0);
    return Number.isInteger(customerNailId) && customerNailId > 0;
  });

  return Number(matchedItem?.customerNailId || 0);
}

function isNailLinkedBookingItem(item) {
  return Boolean(
    toNullableNumber(item?.nailVariantId)
    || toNullableUuid(item?.customerNailRequestId)
    || toNullableNumber(item?.customerNailId)
    || toNullableNumber(item?.shapeMethodConfigId)
    || String(item?.nailVariantName || "").trim()
    || String(item?.customerNailName || "").trim(),
  );
}

function buildServiceOnlyBookingItem(item, fallbackQuantity = 1) {
  return {
    nailVariantId: null,
    serviceId: toNullableUuid(item?.serviceId),
    shapeMethodConfigId: null,
    customerNailRequestId: null,
    customerNailId: null,
    quantity: Number(item?.quantity || fallbackQuantity) || fallbackQuantity,
  };
}

function getShapeLengthVariant(shapeName) {
  const normalized = String(shapeName || "").trim().toLowerCase();

  if (
    normalized.includes("trung bình")
    || normalized.includes("trung binh")
    || normalized.includes("medium")
  ) {
    return "Medium";
  }

  if (normalized.includes("dài") || normalized.includes("dai") || normalized.includes("long")) {
    return "Long";
  }

  return "Short";
}

function getShapeFamilyLabel(shapeName) {
  return String(shapeName || "--")
    .replace(/\btrung bình\b/gi, "")
    .replace(/\btrung binh\b/gi, "")
    .replace(/\bmedium\b/gi, "")
    .replace(/\bdài\b/gi, "")
    .replace(/\bdai\b/gi, "")
    .replace(/\blong\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || "--";
}

function getPreferredShapeVariant(shapeOptions, familyLabel, lengthVariant) {
  const familyOptions = shapeOptions.filter((item) => item.familyLabel === familyLabel);

  if (!familyOptions.length) {
    return null;
  }

  return familyOptions.find((item) => item.lengthVariant === lengthVariant) ?? familyOptions[0];
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-[#ea4f93]" />
      <h2 className="text-xs font-extrabold text-[#ea4f93]">{title}</h2>
    </div>
  );
}

SectionTitle.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
};

function Pill({ active = false, children, className = "", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${active
        ? "border-[#f2bfd4] bg-[#fff1f7] text-[#ea4f93]"
        : "border-[#f4dbe7] bg-white text-[#b18099] hover:bg-[#fff8fc]"
        } ${className}`}
    >
      {children}
    </button>
  );
}

Pill.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

function TemplateCard({ item, isSelected, onSelect }) {
  return (
    <article
      className={`overflow-hidden rounded-[20px] border bg-white shadow-[0_10px_24px_rgba(236,72,153,0.08)] ${isSelected ? "border-[#ef6aac] ring-2 ring-[#ef6aac]/20" : "border-[#f4dbe7]"
        }`}
    >
      <img
        src={item.image}
        alt={item.name}
        className="h-28 w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="p-3">
        <h3 className="text-xs font-extrabold text-[#38253a]">{item.name}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[#fff1f7] px-2 py-1 text-[9px] font-bold text-[#ea4f93]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-[#ea4f93]">{item.price}</p>
            <p className="mt-1 text-[10px] text-[#ae8da0]">{item.duration}</p>
          </div>
          <span className={`rounded-md px-2 py-1 text-[9px] font-extrabold ${item.accentClassName}`}>
            {item.accent}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="flex-1 rounded-[10px] bg-[image:var(--gradient-accent)] px-3 py-2 text-[10px] font-extrabold text-white"
          >
            {isSelected ? "Selected" : item.ctaLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

TemplateCard.propTypes = {
  isSelected: PropTypes.bool.isRequired,
  item: PropTypes.shape({
    accent: PropTypes.string.isRequired,
    accentClassName: PropTypes.string.isRequired,
    ctaLabel: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
};

const TEMPLATE_PRESETS = {
  "chrome-pearl": {
    shape: "Almond",
    length: "Medium",
    color: "Chrome",
    finish: "Glossy",
    decorations: ["Pearl"],
    extras: [],
  },
  "korean-nude": {
    shape: "Oval",
    length: "Short",
    color: "Nude",
    finish: "Glossy",
    decorations: [],
    extras: [],
  },
  "french-ombre": {
    shape: "Coffin",
    length: "Medium",
    color: "Pink",
    finish: "Glossy",
    decorations: ["French Tip"],
    extras: [],
  },
  "wedding-floral": {
    shape: "Almond",
    length: "Long",
    color: "White",
    finish: "Glossy",
    decorations: ["Floral", "Stone"],
    extras: ["Hand Spa"],
  },
  "minimal-beige": {
    shape: "Square",
    length: "Short",
    color: "Nude",
    finish: "Matte",
    decorations: [],
    extras: [],
  },
  "soft-nude": {
    shape: "Oval",
    length: "Short",
    color: "Nude",
    finish: "Glossy",
    decorations: [],
    extras: [],
  },
  "pink-gloss": {
    shape: "Round",
    length: "Medium",
    color: "Pink",
    finish: "Glossy",
    decorations: [],
    extras: [],
  },
  "custom-consultation": {
    shape: "Almond",
    length: "Medium",
    color: "Pink",
    finish: "Glossy",
    decorations: [],
    extras: [],
  },
};

const NAIL_LABELS = ["Thumb", "Index", "Middle", "Ring", "Pinky"];

function createNailDecorationLayout(decorations = []) {
  const layout = Array.from({ length: 5 }, () => []);

  if (decorations.includes("French Tip")) {
    return layout.map(() => ["French Tip"]);
  }

  if (decorations.includes("Cat Eye")) {
    return layout.map(() => ["Cat Eye"]);
  }

  if (decorations.includes("Pearl")) {
    layout[3] = [...layout[3], "Pearl"];
  }

  if (decorations.includes("Stone")) {
    layout[3] = [...layout[3], "Stone"];
  }

  if (decorations.includes("Floral")) {
    layout[3] = [...layout[3], "Floral"];
  }

  if (decorations.includes("Gold Line")) {
    layout[1] = [...layout[1], "Gold Line"];
    layout[3] = [...layout[3], "Gold Line"];
  }

  if (decorations.includes("Sticker")) {
    layout[2] = [...layout[2], "Sticker"];
  }

  return layout;
}

function buildPlacementKey(fingerIndex, label, uniqueToken = "base") {
  return `${fingerIndex}:${label}:${uniqueToken}`;
}

function buildDefaultPlacement(option, fingerIndex, uniqueToken) {
  const resolvedUniqueToken = uniqueToken
    || option.customerComponentId
    || option.componentId
    || option.id
    || option.label
    || "base";
  return {
    key: buildPlacementKey(fingerIndex, option.label, resolvedUniqueToken),
    fingerIndex,
    label: option.label,
    componentId: toNullableNumber(option.componentId || option.id),
    customerComponentId: toNullableNumber(option.customerComponentId),
    imageUrl: String(option.imageUrl || "").trim(),
    componentType: String(option.componentType || "").trim(),
    posX: 50,
    posY: 52,
    scale: 0.8,
    rotation: 0,
    zIndex: 10,
    configJson: JSON.stringify({
      scale: 0.8,
      rotation: 0,
      zIndex: 10,
    }),
  };
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

function getColorStyle(colorMode, primaryColor, secondaryColor) {
  if (colorMode === "gradient") {
    return {
      backgroundImage: buildGradientStyle([primaryColor, secondaryColor]),
    };
  }

  return { backgroundColor: primaryColor };
}

function renderSurfaceEffects(finish) {
  const name = String(finish || "").trim().toLowerCase();

  // 🪞 CHROME - Ultra metallic mirror
  if (name.includes("chrome") || name.includes("mirror") || name.includes("tráng gương") || name.includes("metallic")) {
    return (
      <>
        {/* Silver metallic base sheen */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(200,210,220,0.4) 35%, rgba(80,90,100,0.35) 65%, rgba(255,255,255,0.6) 100%)`,
        }} />
        {/* Primary chrome streak */}
        <div className="pointer-events-none absolute" style={{
          top: '5%', left: '15%', width: '30%', height: '65%',
          background: `linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.45) 50%, transparent 100%)`,
          filter: 'blur(3px)', borderRadius: '50%',
        }} />
        {/* Center bright line */}
        <div className="pointer-events-none absolute" style={{
          top: '8%', left: '35%', width: '8%', height: '55%',
          background: `linear-gradient(to bottom, rgba(255,255,255,1.0) 0%, rgba(255,255,255,0.3) 70%, transparent 100%)`,
          filter: 'blur(1px)', borderRadius: '50%',
        }} />
        {/* Right edge reflection */}
        <div className="pointer-events-none absolute" style={{
          top: '15%', right: '8%', width: '22%', height: '50%',
          background: `radial-gradient(ellipse, rgba(220,230,240,0.54) 0%, transparent 70%)`,
          filter: 'blur(4px)',
        }} />
        {/* Bottom dark shadow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{
          height: '35%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)',
        }} />
      </>
    );
  }

  // 🌈 HOLOGRAPHIC - Visible rainbow prism
  if (name.includes("holographic") || name.includes("holo")) {
    return (
      <>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(160deg,
              hsl(0,100%,65%) 0%,
              hsl(30,100%,60%) 15%,
              hsl(55,100%,60%) 28%,
              hsl(130,80%,55%) 42%,
              hsl(200,100%,60%) 57%,
              hsl(260,90%,65%) 72%,
              hsl(300,90%,65%) 85%,
              hsl(340,100%,65%) 100%)`,
            opacity: 0.63,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(45deg,
              hsl(320,100%,70%) 0%,
              transparent 25%,
              hsl(190,100%,65%) 45%,
              transparent 65%,
              hsl(270,100%,70%) 90%)`,
            opacity: 0.38,
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            top: '5%', left: '10%', width: '50%', height: '45%',
            background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 45%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            height: '25%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 100%)',
          }}
        />
      </>
    );
  }

  // 😺 CAT EYE - Magnetic vertical streak
  if (name.includes("cat") || name.includes("cateye") || name.includes("cat-eye")) {
    return (
      <>
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.12) 100%)',
        }} />
        <div className="pointer-events-none absolute" style={{
          top: 0, bottom: 0,
          left: '50%',
          width: '52%',
          transform: 'translateX(-50%) rotate(0deg)',
          background: `linear-gradient(to right,
            transparent 0%,
            rgba(255,255,255,0.2) 25%,
            rgba(255,255,255,0.6) 50%,
            rgba(255,255,255,0.2) 75%,
            transparent 100%)`,
          filter: 'blur(5px)',
        }} />
        <div className="pointer-events-none absolute inset-x-0 top-0" style={{
          height: '28%',
          background: `linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 100%)`,
        }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{
          height: '25%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 100%)',
        }} />
      </>
    );
  }

  // 🎭 MATTE - Soft flat finish (no shine)
  if (name.includes("matte") || name.includes("nhám")) {
    return (
      <>
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(0.5px)',
        }} />
        <div className="pointer-events-none absolute inset-x-0 top-0" style={{
          height: '40%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 100%)',
        }} />
      </>
    );
  }

  // 🧪 JELLY - Border inset translucent sheen
  if (name.includes("jelly")) {
    return (
      <span className="pointer-events-none absolute inset-[6%] rounded-[inherit] border border-white/35 bg-white/12" />
    );
  }

  // ✨ GLITTER - Sparkles
  if (name.includes("glitter")) {
    return (
      <>
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(255,255,255,0.95)_0_1px,transparent_1.5px),radial-gradient(circle_at_70%_22%,rgba(255,255,255,0.75)_0_1px,transparent_1.6px),radial-gradient(circle_at_46%_68%,rgba(255,255,255,0.85)_0_1px,transparent_1.5px),radial-gradient(circle_at_78%_74%,rgba(255,255,255,0.9)_0_1px,transparent_1.8px)] opacity-85" />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.12)_55%,transparent_100%)]" />
      </>
    );
  }

  // ✨ GLOSSY (Default) - Natural shine
  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(180,180,200,0.1) 40%, rgba(80,80,120,0.15) 75%, rgba(40,40,80,0.2) 100%)',
      }} />
      <div className="pointer-events-none absolute" style={{
        top: '5%', left: '8%', width: '55%', height: '60%',
        background: `radial-gradient(ellipse at 28% 25%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.22) 40%, transparent 72%)`,
        filter: `blur(8px)`,
        transform: 'rotate(-12deg)',
      }} />
      <div className="pointer-events-none absolute" style={{
        top: '10%', left: '18%', width: '16%', height: '52%',
        background: `linear-gradient(to bottom, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.25) 45%, transparent 100%)`,
        filter: `blur(2px)`,
        borderRadius: '50%',
      }} />
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{
        height: '32%',
        background: `linear-gradient(to bottom, rgba(255,255,255,0.27) 0%, transparent 100%)`,
      }} />
      <div className="pointer-events-none absolute" style={{
        top: '18%', right: '8%', width: '22%', height: '42%',
        background: `radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)`,
        filter: `blur(4px)`,
      }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{
        height: '35%',
        background: 'linear-gradient(to top, rgba(60,40,80,0.28) 0%, rgba(60,40,80,0.08) 60%, transparent 100%)',
      }} />
      <div className="pointer-events-none absolute inset-y-0 right-0" style={{
        width: '20%',
        background: 'linear-gradient(to left, rgba(60,40,80,0.15) 0%, transparent 100%)',
      }} />
    </>
  );
}

function PreviewNail({ components = [], finish, fingerLabel, index, isActive, shape, length, colorStyle, shapeImageUrl }) {
  const metrics = getNailMetrics(shape, length, index);
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
    <div className={`flex flex-col items-center gap-2 ${isActive ? "scale-[1.03]" : ""}`}>
      <div
        className={`relative w-[3.8rem] overflow-hidden rounded-t-[1.9rem] rounded-b-[0.9rem] border-2 border-[#f7cadd] bg-[linear-gradient(180deg,#fff7fb_0%,#fff1f8_100%)] shadow-[0_14px_22px_rgba(236,72,153,0.10)] ${isActive ? "ring-2 ring-[#ef6aac]/45 ring-offset-2 ring-offset-[#fff2f8]" : ""}`}
        style={{ height: metrics.height + 34 }}
      >
        <div className="absolute inset-[10%]" style={maskStyle}>
          <div className="absolute inset-0" style={colorStyle} />
          {renderSurfaceEffects(finish)}

          {shapeImageUrl ? (
            <img
              src={shapeImageUrl}
              alt={`${shape} shape`}
              className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-multiply pointer-events-none"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}

          {components.map((component) => (
            component.imageUrl ? (
              <img
                key={component.key}
                src={component.imageUrl}
                alt={component.label}
                className="absolute h-9 w-9 object-contain drop-shadow-[0_4px_8px_rgba(234,79,147,0.18)]"
                style={{
                  left: `${component.posX}%`,
                  top: `${component.posY}%`,
                  zIndex: component.zIndex,
                  transform: `translate(-50%, -50%) scale(${component.scale}) rotate(${component.rotation}deg)`,
                }}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : null
          ))}
        </div>
      </div>

      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#ea4f93] shadow-[0_6px_16px_rgba(236,72,153,0.06)] border border-[#fce6f3]">
        {fingerLabel}
      </span>
    </div>
  );
}

PreviewNail.propTypes = {
  colorStyle: PropTypes.shape({}).isRequired,
  components: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    posX: PropTypes.number.isRequired,
    posY: PropTypes.number.isRequired,
    rotation: PropTypes.number.isRequired,
    scale: PropTypes.number.isRequired,
    zIndex: PropTypes.number,
  })).isRequired,
  fingerLabel: PropTypes.string.isRequired,
  finish: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  length: PropTypes.string.isRequired,
  shape: PropTypes.string.isRequired,
  shapeImageUrl: PropTypes.string,
};

function getNailMetrics(shape, _length, index) {
  const normalized = String(shape || "").trim().toLowerCase();
  let heights = [48, 60, 72, 60, 46];

  if (normalized.includes("stiletto")) {
    heights = [54, 68, 82, 66, 52];
  } else if (normalized.includes("ballerina") || normalized.includes("coffin")) {
    heights = [52, 66, 80, 64, 50];
  } else if (normalized.includes("almond") || normalized.includes("oval")) {
    heights = [50, 62, 76, 62, 48];
  } else if (normalized.includes("round")) {
    heights = [44, 54, 66, 54, 40];
  } else if (normalized.includes("square") || normalized.includes("squoval")) {
    heights = [46, 58, 70, 58, 44];
  }

  const shapeClassMap = {
    Almond: "rounded-t-[26px] rounded-b-[18px]",
    Square: "rounded-t-[10px] rounded-b-[8px]",
    Round: "rounded-t-[30px] rounded-b-[24px]",
    Oval: "rounded-t-[24px] rounded-b-[22px]",
    Coffin: "rounded-t-[14px] rounded-b-[8px] [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)]",
  };

  return {
    height: heights[index] ?? 60,
    shapeClassName: shapeClassMap[shape] ?? shapeClassMap.Almond,
  };
}

function getChoiceValue(item) {
  return typeof item === "string" ? item : item?.label ?? "";
}

function ChoiceGrid({ items, selected, onSelect, type = "pill" }) {
  if (type === "color") {
    return (
      <div className="flex flex-wrap gap-3">
        {items.map((item) => {
          const isGradient = item.swatch.startsWith("linear-gradient");
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelect(item.label)}
              className="flex flex-col items-center gap-2 text-[10px] font-bold text-[#8c7285]"
            >
              <span
                className={`block h-7 w-7 rounded-full border-2 ${selected === item.label ? "border-[#ea4f93] ring-2 ring-[#f7bdd6]" : "border-white shadow-sm"
                  }`}
                style={isGradient ? { backgroundImage: item.swatch } : { backgroundColor: item.swatch }}
              />
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "shape" || type === "length") {
    return (
      <div className="flex flex-wrap gap-3">
        {items.map((item) => {
          const value = getChoiceValue(item);
          const metaLabel = typeof item === "string" ? "" : formatOptionMeta(item);
          const imageUrl = typeof item === "string" ? "" : String(item?.imageUrl || "").trim();
          const isActive = selected === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className={`flex min-w-[64px] flex-col items-center rounded-[14px] border px-3 py-3 text-[10px] font-bold ${isActive
                ? "border-[#ef6aac] bg-[#fff4f8] text-[#ea4f93] shadow-[0_10px_20px_rgba(236,72,153,0.12)]"
                : "border-[#f4dbe7] bg-white text-[#b18099]"
                }`}
            >
              {type === "shape" && imageUrl ? (
                <img
                  src={imageUrl}
                  alt={value}
                  className="mb-2 h-10 w-10 rounded-full border border-[#f7d5e4] bg-white object-cover p-1"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span
                  className={`mb-2 block rounded-full bg-[linear-gradient(180deg,#ffd7ea_0%,#f3b8d2_100%)] ${type === "shape"
                    ? value === "Coffin"
                      ? "h-8 w-6 rounded-sm"
                      : value === "Square"
                        ? "h-8 w-6 rounded-[4px]"
                        : value === "Oval"
                          ? "h-8 w-6 rounded-[45%]"
                          : value === "Round"
                            ? "h-8 w-6 rounded-[50%]"
                            : "h-8 w-6 rounded-[12px]"
                    : "h-7 w-3.5"
                    }`}
                />
              )}
              <span>{value}</span>
              {type === "length" && typeof item !== "string" && item?.variantLabel ? (
                <span className="mt-1 text-center text-[9px] font-semibold text-[#b48aa0]">
                  {item.variantLabel}
                </span>
              ) : null}
              {metaLabel ? <span className="mt-1 text-center text-[9px] font-semibold text-[#b48aa0]">{metaLabel}</span> : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const value = getChoiceValue(item);
        const isSelected = selected.includes(value);
        const metaLabel = typeof item === "string" ? "" : formatOptionMeta(item);
        const subLabel = typeof item === "string" ? "" : item?.componentType || "";
        const imageUrl = typeof item === "string" ? "" : String(item?.imageUrl || "").trim();

        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={`rounded-[14px] border px-3 py-2 text-left transition flex items-center gap-3 ${isSelected
              ? "border-[#f2bfd4] bg-[#fff1f7] text-[#ea4f93]"
              : "border-[#f4dbe7] bg-white text-[#b18099] hover:bg-[#fff8fc]"
              }`}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt={value}
                className="h-10 w-10 shrink-0 rounded-xl border border-[#f3c8db] bg-white object-contain p-1"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold truncate">{value}</p>
              {subLabel ? <p className="mt-0.5 text-[9px] font-semibold text-[#a98c9f] truncate">{subLabel}</p> : null}
              {metaLabel ? <p className="mt-0.5 text-[9px] font-semibold text-[#d2508a] truncate">{metaLabel}</p> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

ChoiceGrid.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        imageUrl: PropTypes.string,
        label: PropTypes.string,
        name: PropTypes.string,
        price: PropTypes.number,
        duration: PropTypes.number,
        swatch: PropTypes.string,
        componentType: PropTypes.string,
        description: PropTypes.string,
      }),
    ]),
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  selected: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
  type: PropTypes.oneOf(["pill", "color", "shape", "length"]),
};

export function StaffNailDesignStudioPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams();
  const studioState = location.state?.designStudio ?? null;
  const booking = getMockBookingById(bookingId) ?? studioState?.booking ?? null;
  const studio = useMemo(() => {
    const mockStudio = getStaffDesignStudioExperienceById(bookingId);

    if (mockStudio) {
      return mockStudio;
    }

    if (!studioState) {
      return null;
    }

    const baseStudio = getStaffDesignStudioExperienceById("BKG-2408");

    if (!baseStudio) {
      return null;
    }

    return {
      ...baseStudio,
      bookingCode: studioState.bookingCode || baseStudio.bookingCode,
      customerName: studioState.customerName || baseStudio.customerName,
      staffName: studioState.staffName || baseStudio.staffName,
      statusLabel: studioState.statusLabel || baseStudio.statusLabel,
      selectedDesign: {
        ...baseStudio.selectedDesign,
        name: studioState.selectedDesignName || baseStudio.selectedDesign.name,
        image: studioState.selectedDesignImage || baseStudio.selectedDesign.image,
      },
    };
  }, [bookingId, studioState]);

  const [selectedTemplateId, setSelectedTemplateId] = useState(studio?.selectedDesign.id ?? "");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const previewContainerRef = useRef(null);
  const hasHydratedInitialNailRef = useRef(false);
  const [selectedShape, setSelectedShape] = useState(
    getShapeFamilyLabel(studio?.builder.initialSelection.shape ?? ""),
  );
  const [selectedLength, setSelectedLength] = useState(
    getShapeLengthVariant(studio?.builder.initialSelection.shape ?? studio?.builder.initialSelection.length ?? ""),
  );
  const [selectedColorFingerIndices, setSelectedColorFingerIndices] = useState([3]);
  const [fingerColorConfigs, setFingerColorConfigs] = useState(
    Array.from({ length: NAIL_LABELS.length }, () =>
      createDefaultFingerColor(
        rgbToHex(studio?.builder.colors?.[0]?.swatch || "#f8b4d9"),
        rgbToHex(studio?.builder.colors?.[1]?.swatch || "#f3e8ff"),
      ),
    ),
  );
  const [selectedFinish, setSelectedFinish] = useState(studio?.builder.initialSelection.finish ?? "");
  const [isDesignConfirmed, setIsDesignConfirmed] = useState(false);
  const [activeNailIndex, setActiveNailIndex] = useState(3);
  const [templateStartIndex, setTemplateStartIndex] = useState(0);
  const [showAllDesigns, setShowAllDesigns] = useState(false);
  const [designTemplates, setDesignTemplates] = useState([]);
  const [designVariants, setDesignVariants] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [designView, setDesignView] = useState("designs");
  const [designQuery, setDesignQuery] = useState("");
  const [isDesignsLoading, setIsDesignsLoading] = useState(true);
  const [isVariantsLoading, setIsVariantsLoading] = useState(false);
  const [designError, setDesignError] = useState("");
  const [isBuilderCatalogLoading, setIsBuilderCatalogLoading] = useState(true);
  const [builderCatalogError, setBuilderCatalogError] = useState("");
  const [shapeOptions, setShapeOptions] = useState([]);
  const [surfaceOptions, setSurfaceOptions] = useState([]);
  const [decorationOptions, setDecorationOptions] = useState([]);
  const [extraServiceOptions, setExtraServiceOptions] = useState([]);
  const [nailDecorations, setNailDecorations] = useState(
    createNailDecorationLayout(studio?.builder.initialSelection.decorations ?? []),
  );
  const [componentPlacements, setComponentPlacements] = useState([]);
  const [selectedPlacementKey, setSelectedPlacementKey] = useState("");
  const [selectedExtras, setSelectedExtras] = useState(studio?.builder.initialSelection.extras ?? []);
  const [bookingDetail, setBookingDetail] = useState(studioState?.booking ?? null);
  const [bookingDetailError, setBookingDetailError] = useState("");
  const [confirmedCustomerNail, setConfirmedCustomerNail] = useState(null);
  const [isConfirmingDesign, setIsConfirmingDesign] = useState(false);
  const [isUpdatingBookingDesign, setIsUpdatingBookingDesign] = useState(false);
  const [designActionError, setDesignActionError] = useState("");
  const [designActionSuccess, setDesignActionSuccess] = useState("");
  const [customerNailNameDraft, setCustomerNailNameDraft] = useState("");
  const templateWindowSize = 3;
  const resolvedBookingApiId = useMemo(
    () => String(studioState?.booking?.bookingId || bookingId || "").trim(),
    [bookingId, studioState?.booking?.bookingId],
  );

  useEffect(() => {
    if (!isUuidLike(resolvedBookingApiId)) {
      return undefined;
    }

    let isMounted = true;

    const loadBookingDetail = async () => {
      try {
        const nextBookingDetail = await fetchStaffBookingDetail(resolvedBookingApiId);

        if (!isMounted) {
          return;
        }

        setBookingDetail(nextBookingDetail);
        setBookingDetailError("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to load booking detail.";
        setBookingDetailError(message);
      }
    };

    void loadBookingDetail();

    return () => {
      isMounted = false;
    };
  }, [resolvedBookingApiId]);

  const loadDesignVariants = async (designId) => {
    if (!designId) {
      return;
    }

    setIsVariantsLoading(true);
    setDesignError("");
    setSelectedVariantId("");
    setSelectedVariant(null);

    try {
      const response = await axiosClient.get("/NailVariants", {
        headers: getAuthHeaders(),
        params: {
          pageNumber: 1,
          pageSize: 100,
          nailDesignId: designId,
        },
      });
      const payload = unwrapApiResponse(response, "Failed to load nail design variants.");
      const items = Array.isArray(payload?.items) ? payload.items.map(buildVariantTemplateFromApi) : [];

      setDesignVariants(items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load nail design variants.";
      setDesignError(message);
    } finally {
      setIsVariantsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchTemplates = async () => {
      setIsDesignsLoading(true);
      setDesignError("");

      try {
        const response = await axiosClient.get("/NailDesigns", {
          headers: getAuthHeaders(),
          params: {
            pageNumber: 1,
            pageSize: 50,
            name: designQuery || undefined,
          },
        });

        const payload = unwrapApiResponse(response, "Failed to load nail design templates.");
        const items = Array.isArray(payload?.items) ? payload.items.map(buildDesignTemplateFromApi) : [];

        if (!isMounted) {
          return;
        }

        setDesignTemplates(items);
        setTemplateStartIndex(0);
        setShowAllDesigns(false);
        if (!selectedTemplateId && items[0]) {
          setSelectedTemplateId(items[0].id);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to load nail design templates.";
        setDesignError(message);
      } finally {
        if (isMounted) {
          setIsDesignsLoading(false);
        }
      }
    };

    void fetchTemplates();

    return () => {
      isMounted = false;
    };
  }, [designQuery, selectedTemplateId]);

  useEffect(() => {
    let isMounted = true;

    const loadBuilderCatalog = async () => {
      setIsBuilderCatalogLoading(true);
      setBuilderCatalogError("");

      try {
        const [shapes, surfaces, components, services] = await Promise.all([
          fetchStaffBuilderNailShapes(),
          fetchStaffBuilderNailSurfaces(),
          fetchStaffBuilderNailComponents(),
          fetchServiceCatalog({ pageNumber: 1, pageSize: 100 }),
        ]);

        if (!isMounted) {
          return;
        }

        const nextShapeOptions = shapes.map(buildShapeOption);
        const nextSurfaceOptions = surfaces.map(buildSurfaceOption);
        const nextDecorationOptions = components.map(buildDecorationOption);
        const nextExtraServiceOptions = services.items.map(buildExtraServiceOption);

        setShapeOptions(nextShapeOptions);
        setSurfaceOptions(nextSurfaceOptions);
        setDecorationOptions(nextDecorationOptions);
        setExtraServiceOptions(nextExtraServiceOptions);
        setSelectedShape((current) => {
          const nextValue = nextShapeOptions.find((item) => item.familyLabel === current)?.familyLabel;
          return nextValue
            || getShapeFamilyLabel(studio?.builder.initialSelection.shape)
            || nextShapeOptions[0]?.familyLabel
            || current;
        });
        setSelectedLength((current) => {
          const currentFamily = getShapeFamilyLabel(studio?.builder.initialSelection.shape);
          const preferredFamily = nextShapeOptions.find((item) => item.familyLabel === currentFamily)?.familyLabel
            || nextShapeOptions[0]?.familyLabel
            || "";
          const preferredOption = getPreferredShapeVariant(
            nextShapeOptions,
            preferredFamily,
            current,
          );

          return preferredOption?.lengthVariant
            || getShapeLengthVariant(studio?.builder.initialSelection.shape)
            || "Short";
        });
        setSelectedFinish((current) => {
          const nextValue = nextSurfaceOptions.find((item) => item.label === current)?.label;
          return nextValue || nextSurfaceOptions.find((item) => item.label === studio?.builder.initialSelection.finish)?.label || nextSurfaceOptions[0]?.label || current;
        });
        setSelectedExtras((current) => {
          const allowedLabels = new Set(nextExtraServiceOptions.map((item) => item.label));
          const sanitizedCurrent = current.filter((item) => allowedLabels.has(item));

          if (sanitizedCurrent.length > 0) {
            return sanitizedCurrent;
          }

          return (studio?.builder.initialSelection.extras ?? []).filter((item) => allowedLabels.has(item));
        });
        setNailDecorations((current) => {
          const allowedLabels = new Set(nextDecorationOptions.map((item) => item.label));
          const sourceLayout = Array.isArray(current) && current.length === NAIL_LABELS.length
            ? current
            : createNailDecorationLayout(studio?.builder.initialSelection.decorations ?? []);

          const nextDecorations = sourceLayout.map((items) => items.filter((item) => allowedLabels.has(item)));
          const nextDecorationMap = new Map(nextDecorationOptions.map((item) => [item.label, item]));
          const nextPlacements = [];

          nextDecorations.forEach((items, fingerIndex) => {
            items.forEach((label) => {
              const option = nextDecorationMap.get(label);

              if (!option) {
                return;
              }

              nextPlacements.push(buildDefaultPlacement(option, fingerIndex));
            });
          });

          setComponentPlacements(nextPlacements);
          setSelectedPlacementKey(nextPlacements[0]?.key || "");

          return nextDecorations;
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to load builder catalog.";
        setBuilderCatalogError(message);
      } finally {
        if (isMounted) {
          setIsBuilderCatalogLoading(false);
        }
      }
    };

    void loadBuilderCatalog();

    return () => {
      isMounted = false;
    };
  }, [studio]);

  const activeTemplate = useMemo(() => {
    if (designView === "variants" && selectedVariant) {
      return selectedVariant;
    }

    const selectedDesignTemplate = designTemplates.find((item) => item.id === selectedTemplateId);

    if (selectedDesignTemplate) {
      return selectedDesignTemplate;
    }

    return selectedDesign ?? studio?.selectedDesign;
  }, [designTemplates, designView, selectedDesign, selectedTemplateId, selectedVariant, studio]);
  const visibleTemplates = useMemo(() => {
    if (designView === "variants") {
      return designVariants;
    }

    if (showAllDesigns) {
      return designTemplates;
    }

    if (!designTemplates.length) {
      return [];
    }

    if (designTemplates.length <= templateWindowSize) {
      return designTemplates;
    }

    return Array.from({ length: templateWindowSize }, (_, offset) => {
      const index = (templateStartIndex + offset) % designTemplates.length;
      return designTemplates[index];
    });
  }, [designTemplates, designVariants, designView, showAllDesigns, templateStartIndex]);
  const activeColorConfig = useMemo(
    () => normalizeFingerColorConfig(
      fingerColorConfigs[selectedColorFingerIndices[0] ?? 0] ?? createDefaultFingerColor(),
    ),
    [fingerColorConfigs, selectedColorFingerIndices],
  );
  const selectedColorMode = activeColorConfig.mode;
  const selectedPrimaryColor = activeColorConfig.primaryColor;
  const selectedSecondaryColor = activeColorConfig.secondaryColor;
  const selectedGradientStops = activeColorConfig.gradientStops;
  const selectedColor = useMemo(
    () => getFingerColorSummary(activeColorConfig),
    [activeColorConfig],
  );
  const shapeFamilyOptions = useMemo(() => {
    const familyMap = new Map();

    shapeOptions.forEach((item) => {
      if (familyMap.has(item.familyLabel)) {
        const current = familyMap.get(item.familyLabel);
        if (!current.imageUrl && item.imageUrl) {
          familyMap.set(item.familyLabel, { ...current, imageUrl: item.imageUrl });
        }
        return;
      }

      familyMap.set(item.familyLabel, {
        ...item,
        label: item.familyLabel,
      });
    });

    return [...familyMap.values()];
  }, [shapeOptions]);
  const lengthVariantOptions = useMemo(() => {
    const familyOptions = shapeOptions.filter((item) => item.familyLabel === selectedShape);
    const variants = [];

    if (familyOptions.some((item) => item.lengthVariant === "Short")) {
      variants.push({
        label: "Short",
        variantLabel: selectedShape,
      });
    }

    if (familyOptions.some((item) => item.lengthVariant === "Medium")) {
      variants.push({
        label: "Medium",
        variantLabel: `${selectedShape} Trung Bình`,
      });
    }

    if (familyOptions.some((item) => item.lengthVariant === "Long")) {
      variants.push({
        label: "Long",
        variantLabel: `${selectedShape} Dài`,
      });
    }

    return variants;
  }, [selectedShape, shapeOptions]);
  const selectedShapeOption = useMemo(
    () => getPreferredShapeVariant(shapeOptions, selectedShape, selectedLength),
    [selectedLength, selectedShape, shapeOptions],
  );
  const selectedSurfaceOption = useMemo(
    () => surfaceOptions.find((item) => item.label === selectedFinish) ?? null,
    [selectedFinish, surfaceOptions],
  );
  const decorationOptionMap = useMemo(
    () => new Map(decorationOptions.map((item) => [item.label, item])),
    [decorationOptions],
  );
  const extraServiceOptionMap = useMemo(
    () => new Map(extraServiceOptions.map((item) => [item.label, item])),
    [extraServiceOptions],
  );
  const selectedDecorations = useMemo(
    () => {
      if (activeNailIndex === -1) {
        return Array.from(new Set(nailDecorations.flat()));
      }

      return nailDecorations[activeNailIndex] ?? [];
    },
    [activeNailIndex, nailDecorations],
  );
  const selectedDecorationEntries = useMemo(
    () => nailDecorations
      .flatMap((items, fingerIndex) => items.map((label) => ({ fingerIndex, label })))
      .map((item) => ({
        ...item,
        option: decorationOptionMap.get(item.label) ?? null,
      }))
      .filter((item) => item.option),
    [decorationOptionMap, nailDecorations],
  );
  const selectedExtraOptions = useMemo(
    () => selectedExtras
      .map((item) => extraServiceOptionMap.get(item) ?? null)
      .filter(Boolean),
    [extraServiceOptionMap, selectedExtras],
  );
  const suggestedCustomerNailName = useMemo(() => {
    const parts = [
      selectedVariant?.name || selectedDesign?.name || studio?.selectedDesign?.name || "Custom design",
      selectedShape,
      selectedFinish,
    ].filter(Boolean);

    return parts.join(" • ").trim() || "Custom Nail Design";
  }, [selectedDesign?.name, selectedFinish, selectedShape, selectedVariant?.name, studio?.selectedDesign?.name]);
  const customerNailName = useMemo(
    () => String(customerNailNameDraft || "").trim() || suggestedCustomerNailName,
    [customerNailNameDraft, suggestedCustomerNailName],
  );
  const customerNailCustomColor = useMemo(
    () => JSON.stringify({
      mode: "perFinger",
      fingers: fingerColorConfigs.map((item, index) => ({
        ...normalizeFingerColorConfig(item),
        fingerIndex: index + 1,
        gradient: {
          stops: normalizeFingerColorConfig(item).gradientStops,
        },
      })),
    }),
    [fingerColorConfigs],
  );
  const resolvedSelectedVariantId = useMemo(
    () => toNullableNumber(selectedVariant?.raw?.nailVariantId || selectedVariantId),
    [selectedVariant?.raw?.nailVariantId, selectedVariantId],
  );
  const isVariantSelectionMode = Boolean(resolvedSelectedVariantId);
  const activeFingerPlacements = useMemo(
    () => componentPlacements.filter((item) => (
      activeNailIndex === -1 ? true : item.fingerIndex === activeNailIndex
    )),
    [activeNailIndex, componentPlacements],
  );
  const selectedPlacement = useMemo(
    () => componentPlacements.find((item) => item.key === selectedPlacementKey) ?? activeFingerPlacements[0] ?? null,
    [activeFingerPlacements, componentPlacements, selectedPlacementKey],
  );
  // const estimationRows = useMemo(() => {
  //   const rows = [];

  //   if (selectedShapeOption) {
  //     rows.push({
  //       key: `shape-${selectedShapeOption.id}`,
  //       label: `Shape • ${selectedShapeOption.label}`,
  //       price: selectedShapeOption.price,
  //       duration: selectedShapeOption.duration,
  //     });
  //   }

  //   if (selectedSurfaceOption) {
  //     rows.push({
  //       key: `surface-${selectedSurfaceOption.id}`,
  //       label: `Finish / Texture • ${selectedSurfaceOption.label}`,
  //       price: selectedSurfaceOption.price,
  //       duration: selectedSurfaceOption.duration,
  //     });
  //   }

  //   selectedDecorationEntries.forEach((item, index) => {
  //     rows.push({
  //       key: `decoration-${item.option.id}-${item.fingerIndex}-${index}`,
  //       label: `${NAIL_LABELS[item.fingerIndex]} • ${item.option.label}`,
  //       price: item.option.price,
  //       duration: item.option.duration,
  //     });
  //   });

  //   selectedExtraOptions.forEach((item) => {
  //     rows.push({
  //       key: `extra-${item.id}`,
  //       label: (
  //         <>
  //           <span className="font-semibold text-black">Extra</span>
  //           {" • "}
  //           {item.label}
  //         </>
  //       ),
  //       price: item.price,
  //       duration: item.duration,
  //     });
  //   });

  //   return rows;
  // }, [selectedDecorationEntries, selectedExtraOptions, selectedShapeOption, selectedSurfaceOption]);

  const estimationRows = useMemo(() => {
    const nailRows = [];
    const rows = [];

    if (selectedShapeOption) {
      nailRows.push({
        key: `shape-${selectedShapeOption.id}`,
        label: `Shape • ${selectedShapeOption.label}`,
        price: selectedShapeOption.price,
        duration: selectedShapeOption.duration,
      });
    }

    if (selectedSurfaceOption) {
      nailRows.push({
        key: `surface-${selectedSurfaceOption.id}`,
        label: `Finish / Texture • ${selectedSurfaceOption.label}`,
        price: selectedSurfaceOption.price,
        duration: selectedSurfaceOption.duration,
      });
    }

    selectedDecorationEntries.forEach((item, index) => {
      nailRows.push({
        key: `decoration-${item.option.id}-${item.fingerIndex}-${index}`,
        label: `${NAIL_LABELS[item.fingerIndex]} • ${item.option.label}`,
        price: item.option.price,
        duration: item.option.duration,
      });
    });

    rows.push(...nailRows);

    const nailPrice = nailRows.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0,
    );

    const nailDuration = nailRows.reduce(
      (sum, item) => sum + Number(item.duration || 0),
      0,
    );

    rows.push({
      key: "summary-nail-price",
      label: (
        <span className="font-extrabold text-[#38253a]">
          Summary Nail Price
        </span>
      ),
      price: nailPrice,
      duration: nailDuration,
      isSummary: true,
    });

    selectedExtraOptions.forEach((item) => {
      rows.push({
        key: `extra-${item.id}`,
        label: (
          <>
            <span className="font-semibold text-black">Extra</span>
            {" • "}
            {item.label}
          </>
        ),
        price: item.price,
        duration: item.duration,
      });
    });

    return rows;
  }, [
    selectedDecorationEntries,
    selectedExtraOptions,
    selectedShapeOption,
    selectedSurfaceOption,
  ]);

  const totalEstimatedPrice = useMemo(
    () => estimationRows.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [estimationRows],
  );
  const totalEstimatedDuration = useMemo(
    () => estimationRows.reduce((sum, item) => sum + Number(item.duration || 0), 0),
    [estimationRows],
  );
  const totalEstimatedPriceLabel = useMemo(
    () => formatCurrencyValue(totalEstimatedPrice),
    [totalEstimatedPrice],
  );
  const totalEstimatedDurationLabel = useMemo(
    () => formatDurationLabel(totalEstimatedDuration),
    [totalEstimatedDuration],
  );

  const updateSelectedFingerColors = (updater) => {
    if (!selectedColorFingerIndices.length) {
      return;
    }

    setFingerColorConfigs((current) =>
      current.map((item, index) => (
        selectedColorFingerIndices.includes(index) ? updater(item, index) : item
      )),
    );
  };

  const clearSelectedVariant = () => {
    setSelectedVariantId("");
    setSelectedVariant(null);
  };

  const resetConfirmedDesignState = () => {
    setIsDesignConfirmed(false);
    setConfirmedCustomerNail(null);
    setDesignActionError("");
    setDesignActionSuccess("");
  };

  const markAsCustomized = () => {
    resetConfirmedDesignState();

    if (!selectedVariantId) {
      return;
    }

    clearSelectedVariant();
  };

  const syncPlacementsFromDecorations = (nextDecorations, basePlacements = componentPlacements) => {
    const currentMap = new Map(basePlacements.map((item) => [item.key, item]));
    const nextPlacements = [];

    nextDecorations.forEach((items, fingerIndex) => {
      items.forEach((label) => {
        const option = decorationOptionMap.get(label);

        if (!option) {
          return;
        }

        const key = buildPlacementKey(fingerIndex, label, option.customerComponentId || option.componentId || option.id || label);
        nextPlacements.push(currentMap.get(key) ?? buildDefaultPlacement(
          option,
          fingerIndex,
          option.customerComponentId || option.componentId || option.id || label,
        ));
      });
    });

    setComponentPlacements(nextPlacements);
    setSelectedPlacementKey((current) => (
      nextPlacements.some((item) => item.key === current) ? current : nextPlacements[0]?.key || ""
    ));
  };

  const capturePreviewImageFile = async () => {
    if (!previewContainerRef.current) {
      return null;
    }

    try {
      const blob = await toBlob(previewContainerRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fff5fb",
      });

      if (!blob) {
        return null;
      }

      return new File([blob], `customer-nail-preview-${Date.now()}.png`, {
        type: "image/png",
      });
    } catch (error) {
      console.error("Failed to capture live nail preview image.", error);
      return null;
    }
  };

  const applyCustomerNailDetailToBuilder = useEffectEvent((customerNailDetail) => {
    if (!customerNailDetail) {
      return;
    }

    if (customerNailDetail?.name) {
      setCustomerNailNameDraft(String(customerNailDetail.name).trim());
    }

    const nextShapeLabel = String(customerNailDetail?.nailShape?.name || "").trim();
    const nextSurfaceLabel = String(customerNailDetail?.nailSurface?.name || "").trim();

    if (nextShapeLabel) {
      setSelectedShape(getShapeFamilyLabel(nextShapeLabel));
      setSelectedLength(getShapeLengthVariant(nextShapeLabel));
    }

    if (nextSurfaceLabel) {
      setSelectedFinish(nextSurfaceLabel);
    }

    setFingerColorConfigs(
      parseVariantColorJson(
        customerNailDetail?.customColor || customerNailDetail?.colorJson,
        rgbToHex(studio?.builder.colors?.[0]?.swatch || "#f8b4d9"),
        rgbToHex(studio?.builder.colors?.[1]?.swatch || "#f3e8ff"),
      ),
    );
    setSelectedColorFingerIndices([3]);

    const rawComponents = Array.isArray(customerNailDetail?.customerNailComponents)
      ? customerNailDetail.customerNailComponents
      : Array.isArray(customerNailDetail?.nailComponents)
        ? customerNailDetail.nailComponents
        : [];
    const dynamicDecorationOptions = [];
    const dynamicDecorationMap = new Map();
    const nextDecorations = Array.from({ length: NAIL_LABELS.length }, () => []);
    const nextPlacements = [];

    rawComponents.forEach((item, index) => {
      const sourceComponent = item?.customerComponent || item?.component;
      const label = String(sourceComponent?.name || "").trim();
      const fingerIndex = normalizeFingerIndex(item?.fingerIndex);

      if (!label || fingerIndex < 0) {
        return;
      }

      const option = item?.customerComponent
        ? buildCustomerDecorationOption(item.customerComponent)
        : buildDecorationOption(item.component || {
          componentId: item?.componentId,
          name: label,
          imageUrl: sourceComponent?.imageUrl,
          componentType: sourceComponent?.componentType,
        });

      if (!dynamicDecorationMap.has(option.id)) {
        dynamicDecorationMap.set(option.id, option);
        dynamicDecorationOptions.push(option);
      }

      if (!nextDecorations[fingerIndex].includes(label)) {
        nextDecorations[fingerIndex].push(label);
      }

      nextPlacements.push({
        key: buildPlacementKey(
          fingerIndex,
          label,
          item?.customerNailComponentId || item?.nailComponentId || `existing-${index}`,
        ),
        fingerIndex,
        label,
        componentId: toNullableNumber(item?.componentId),
        customerComponentId: toNullableNumber(item?.customerComponentId),
        imageUrl: String(sourceComponent?.imageUrl || "").trim(),
        componentType: String(sourceComponent?.componentType || "").trim(),
        posX: Number(item?.posX ?? 50),
        posY: Number(item?.posY ?? 50),
        ...parsePlacementConfig(item?.configJson),
        configJson: String(item?.configJson || ""),
      });
    });

    if (dynamicDecorationOptions.length > 0) {
      setDecorationOptions((current) => {
        const currentMap = new Map(current.map((item) => [String(item.id), item]));
        dynamicDecorationOptions.forEach((item) => {
          if (!currentMap.has(String(item.id))) {
            currentMap.set(String(item.id), item);
          }
        });
        return [...currentMap.values()];
      });
    }

    setNailDecorations(nextDecorations);
    setComponentPlacements(nextPlacements);
    setSelectedPlacementKey(nextPlacements[0]?.key || "");
  });

  useEffect(() => {
    if (hasHydratedInitialNailRef.current || isBuilderCatalogLoading) {
      return;
    }

    const stateDesignDetail = studioState?.currentDesignDetail || studioState?.designDetail || null;

    if (stateDesignDetail) {
      if (stateDesignDetail?.detailType === "customerNail" || stateDesignDetail?.customerNailId) {
        applyCustomerNailDetailToBuilder(stateDesignDetail);
      } else {
        applyVariantToBuilder(stateDesignDetail);
      }
      hasHydratedInitialNailRef.current = true;
      return;
    }

    if (!bookingDetail) {
      return;
    }

    const customerNailId = toNullableNumber(getPrimaryCustomerNailId(bookingDetail?.bookingItems));
    const nailVariantId = toNullableNumber(getPrimaryNailVariantId(bookingDetail?.bookingItems));

    if (!customerNailId && !nailVariantId) {
      hasHydratedInitialNailRef.current = true;
      return;
    }

    let isMounted = true;

    const hydrateCustomerNail = async () => {
      try {
        if (customerNailId) {
          const customerNailDetail = await fetchStaffCustomerNailDetail(customerNailId);

          if (!isMounted) {
            return;
          }

          applyCustomerNailDetailToBuilder(customerNailDetail);
          return;
        }

        if (nailVariantId) {
          const variantDetail = await fetchStaffNailVariantDetail(nailVariantId);

          if (!isMounted) {
            return;
          }

          applyVariantToBuilder(variantDetail);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to load existing customer nail detail.";
        setBookingDetailError(message);
      } finally {
        if (isMounted) {
          hasHydratedInitialNailRef.current = true;
        }
      }
    };

    void hydrateCustomerNail();

    return () => {
      isMounted = false;
    };
  }, [applyCustomerNailDetailToBuilder, bookingDetail, isBuilderCatalogLoading, studioState]);

  const applyVariantToBuilder = (variantDetail) => {
    if (!variantDetail) {
      return;
    }

    const nextShapeLabel = String(variantDetail?.nailShape?.name || "").trim();
    const nextSurfaceLabel = String(variantDetail?.nailSurface?.name || "").trim();

    if (nextShapeLabel) {
      setSelectedShape(getShapeFamilyLabel(nextShapeLabel));
      setSelectedLength(getShapeLengthVariant(nextShapeLabel));
    }

    if (nextSurfaceLabel) {
      setSelectedFinish(nextSurfaceLabel);
    }

    setSelectedVariantId(String(variantDetail?.nailVariantId || ""));
    setSelectedVariant({
      id: String(variantDetail?.nailVariantId || ""),
      name: String(variantDetail?.name || "Selected variant").trim(),
      image: String(variantDetail?.imageUrl || DEFAULT_DESIGN_IMAGE).trim(),
      price: formatCurrencyValue(variantDetail?.price || 0),
      duration: Number(variantDetail?.duration || 0) > 0
        ? formatDurationLabel(Number(variantDetail?.duration || 0))
        : "Flexible",
      tags: [variantDetail?.nailShape?.name, variantDetail?.nailSurface?.name].filter(Boolean),
      raw: variantDetail,
    });

    setFingerColorConfigs(
      parseVariantColorJson(
        variantDetail?.colorJson,
        rgbToHex(studio?.builder.colors?.[0]?.swatch || "#f8b4d9"),
        rgbToHex(studio?.builder.colors?.[1]?.swatch || "#f3e8ff"),
      ),
    );
    setSelectedColorFingerIndices([3]);

    const allowedDecorationLabels = new Set(decorationOptions.map((item) => item.label));
    const nextDecorations = Array.from({ length: NAIL_LABELS.length }, () => []);
    const nextPlacements = [];
    const variantComponents = Array.isArray(variantDetail?.nailComponents) ? variantDetail.nailComponents : [];

    variantComponents.forEach((item, index) => {
      const componentName = String(item?.component?.name || "").trim();

      if (!componentName || (allowedDecorationLabels.size > 0 && !allowedDecorationLabels.has(componentName))) {
        return;
      }

      const fingerIndex = normalizeFingerIndex(item?.fingerIndex);

      if (fingerIndex === -1) {
        nextDecorations.forEach((fingerItems, currentFingerIndex) => {
          if (!fingerItems.includes(componentName)) {
            fingerItems.push(componentName);
          }

          nextPlacements.push({
            key: buildPlacementKey(currentFingerIndex, componentName, `variant-${index}-${currentFingerIndex}`),
            fingerIndex: currentFingerIndex,
            label: componentName,
            componentId: Number(item?.component?.componentId || item?.componentId || 0),
            imageUrl: String(item?.component?.imageUrl || "").trim(),
            componentType: String(item?.component?.componentType || "").trim(),
            posX: Number(item?.posX ?? 50),
            posY: Number(item?.posY ?? 50),
            ...parsePlacementConfig(item?.configJson),
            configJson: String(item?.configJson || ""),
          });
        });
        return;
      }

      if (!nextDecorations[fingerIndex].includes(componentName)) {
        nextDecorations[fingerIndex].push(componentName);
      }

      nextPlacements.push({
        key: buildPlacementKey(fingerIndex, componentName, `variant-${index}`),
        fingerIndex,
        label: componentName,
        componentId: Number(item?.component?.componentId || item?.componentId || 0),
        imageUrl: String(item?.component?.imageUrl || "").trim(),
        componentType: String(item?.component?.componentType || "").trim(),
        posX: Number(item?.posX ?? 50),
        posY: Number(item?.posY ?? 50),
        ...parsePlacementConfig(item?.configJson),
        configJson: String(item?.configJson || ""),
      });
    });

    setNailDecorations(nextDecorations);
    setComponentPlacements(nextPlacements);
    setSelectedPlacementKey(nextPlacements[0]?.key || "");
  };

  const handleVariantSelect = async (variantId) => {
    const normalizedVariantId = Number(variantId || 0);

    if (!Number.isInteger(normalizedVariantId) || normalizedVariantId <= 0) {
      return;
    }

    resetConfirmedDesignState();
    setSelectedVariantId(String(normalizedVariantId));

    try {
      const variantDetail = await fetchStaffNailVariantDetail(normalizedVariantId);
      applyVariantToBuilder(variantDetail);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load selected variant detail.";
      setDesignError(message);
    }
  };

  const applyTemplatePreset = async (templateId) => {
    resetConfirmedDesignState();
    setSelectedTemplateId(templateId);
    setSelectedVariantId("");
    setSelectedVariant(null);

    const matchingTemplate = designTemplates.find((item) => item.id === templateId);
    if (matchingTemplate) {
      setSelectedDesign(matchingTemplate);
      setDesignView("variants");
      await loadDesignVariants(templateId);
      return;
    }

    const preset = TEMPLATE_PRESETS[templateId];

    if (!preset) {
      return;
    }

    setSelectedShape(getShapeFamilyLabel(preset.shape));
    setSelectedLength(preset.length || "Short");
    setFingerColorConfigs(Array.from({ length: NAIL_LABELS.length }, () => createDefaultFingerColor(getPresetColorHex(preset.color), "#f3e8ff")));
    setSelectedColorFingerIndices([3]);
    setSelectedFinish(preset.finish);
    const nextDecorations = createNailDecorationLayout(preset.decorations);
    setNailDecorations(nextDecorations);
    syncPlacementsFromDecorations(nextDecorations, []);
    setActiveNailIndex(preset.decorations.length > 0 ? 3 : 0);
    setSelectedExtras(preset.extras);
  };

  const handleTemplateSlide = (direction) => {
    if (showAllDesigns || !designTemplates.length || designTemplates.length <= templateWindowSize) {
      return;
    }

    setTemplateStartIndex((current) => {
      const delta = direction === "next" ? 1 : -1;
      return (current + delta + designTemplates.length) % designTemplates.length;
    });
  };

  const handleBackToDesigns = () => {
    setDesignView("designs");
    setShowAllDesigns(false);
    setDesignVariants([]);
    setSelectedDesign(null);
    setSelectedVariantId("");
    setSelectedVariant(null);
  };

  const handleToggleShowAllDesigns = () => {
    if (designView !== "designs") {
      return;
    }

    setShowAllDesigns((current) => !current);
  };

  if (!booking || !studio) {
    return <Navigate to={ROUTES.staffBookings} replace />;
  }

  const resolvedActiveTemplate = activeTemplate ?? studio.selectedDesign ?? {
    name: "Custom design",
    image: DEFAULT_DESIGN_IMAGE,
    summaryService: "Custom service",
  };

  const toggleArraySelection = (value, current, setter) => {
    markAsCustomized();
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const toggleNailDecoration = (decoration) => {
    markAsCustomized();
    setNailDecorations((current) => {
      const nextDecorations = current.map((items, index) => {
        if (activeNailIndex !== -1 && index !== activeNailIndex) {
          return items;
        }

        return items.includes(decoration)
          ? items.filter((item) => item !== decoration)
          : [...items, decoration];
      });

      syncPlacementsFromDecorations(nextDecorations);
      return nextDecorations;
    });
  };

  const handleShapeSelect = (value) => {
    markAsCustomized();
    setSelectedShape(value);
    const nextVariant = getPreferredShapeVariant(shapeOptions, value, selectedLength)
      ?? getPreferredShapeVariant(shapeOptions, value, "Short")
      ?? getPreferredShapeVariant(shapeOptions, value, "Medium")
      ?? getPreferredShapeVariant(shapeOptions, value, "Long");
    if (nextVariant) {
      setSelectedLength(nextVariant.lengthVariant);
    }
  };

  const handleLengthSelect = (value) => {
    markAsCustomized();
    setSelectedLength(value);
  };

  const handleFinishSelect = (value) => {
    markAsCustomized();
    setSelectedFinish(value);
  };

  const updateFingerColors = (updater) => {
    markAsCustomized();
    updateSelectedFingerColors((item, index) => normalizeFingerColorConfig(updater(
      normalizeFingerColorConfig(item),
      index,
    )));
  };

  const handleGradientStopChange = (stopIndex, value) => {
    updateFingerColors((item) => {
      const gradientStops = [...normalizeFingerColorConfig(item).gradientStops];
      gradientStops[stopIndex] = value;

      return {
        ...item,
        mode: "gradient",
        primaryColor: gradientStops[0],
        secondaryColor: gradientStops[1] || gradientStops[0],
        gradientStops,
      };
    });
  };

  const handleAddGradientStop = () => {
    updateFingerColors((item) => {
      const normalizedConfig = normalizeFingerColorConfig(item);
      const gradientStops = [
        ...normalizedConfig.gradientStops,
        normalizedConfig.gradientStops[normalizedConfig.gradientStops.length - 1] || normalizedConfig.secondaryColor,
      ];

      return {
        ...normalizedConfig,
        mode: "gradient",
        gradientStops,
      };
    });
  };

  const handleRemoveGradientStop = (stopIndex) => {
    updateFingerColors((item) => {
      const normalizedConfig = normalizeFingerColorConfig(item);
      const gradientStops = normalizedConfig.gradientStops.filter((_, index) => index !== stopIndex);
      const nextStops = normalizeGradientStops(
        gradientStops,
        gradientStops[0] || normalizedConfig.primaryColor,
        gradientStops[1] || gradientStops[0] || normalizedConfig.secondaryColor,
      );

      return {
        ...normalizedConfig,
        mode: "gradient",
        primaryColor: nextStops[0],
        secondaryColor: nextStops[1],
        gradientStops: nextStops,
      };
    });
  };

  const updatePlacementConfig = (placementKey, patch) => {
    markAsCustomized();
    setComponentPlacements((current) =>
      current.map((item) => {
        if (item.key !== placementKey) {
          return item;
        }

        const nextItem = { ...item, ...patch };

        return {
          ...nextItem,
          configJson: JSON.stringify({
            scale: nextItem.scale,
            rotation: nextItem.rotation,
            zIndex: nextItem.zIndex,
          }),
        };
      }),
    );
  };

  const handlePreviewNailSelect = (fingerIndex) => {
    setActiveNailIndex(fingerIndex);
    const firstPlacement = componentPlacements.find((item) => item.fingerIndex === fingerIndex);
    setSelectedPlacementKey((current) => {
      if (current && componentPlacements.some((item) => item.key === current && item.fingerIndex === fingerIndex)) {
        return current;
      }

      return firstPlacement?.key || "";
    });
  };

  const detailRoute = getStaffBookingDetailRoute(bookingId);
  const handleConfirmDesign = async () => {
    if (!selectedShapeOption || !selectedSurfaceOption || isConfirmingDesign) {
      return;
    }

    if (isVariantSelectionMode) {
      setConfirmedCustomerNail(null);
      setIsDesignConfirmed(true);
      setDesignActionError("");
      setDesignActionSuccess("Variant confirmed successfully. You can update this booking now.");
      toast.success("Variant confirmed successfully.");
      return;
    }

    setIsConfirmingDesign(true);
    setDesignActionError("");
    setDesignActionSuccess("");

    try {
      const previewImageFile = await capturePreviewImageFile();
      const createdCustomerNail = await createStaffCustomerNail({
        name: customerNailName,
        nailShapeId: Number(selectedShapeOption.nailShapeId || selectedShapeOption.id || 0),
        nailSurfaceId: Number(selectedSurfaceOption.nailSurfaceId || selectedSurfaceOption.id || 0),
        customColor: customerNailCustomColor,
        isPublic: true,
        image: previewImageFile,
      });

      const componentPayloads = componentPlacements
        .map((item) => ({
          customerNailId: Number(createdCustomerNail?.customerNailId || 0),
          componentId: toNullableNumber(item?.componentId),
          customerComponentId: toNullableNumber(item?.customerComponentId),
          posX: Number(item?.posX ?? 0),
          posY: Number(item?.posY ?? 0),
          fingerIndex: Number(item?.fingerIndex ?? 0),
          configJson: String(item?.configJson || "").trim(),
        }))
        .filter((item) => item.componentId || item.customerComponentId);

      if (componentPayloads.length > 0) {
        await Promise.all(
          componentPayloads.map((item) => createStaffCustomerNailComponent(item)),
        );
      }

      setConfirmedCustomerNail(createdCustomerNail);
      setIsDesignConfirmed(true);
      setDesignActionSuccess("Custom nail created successfully. You can update this booking now.");
      toast.success("Custom nail created successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create customer nail.";
      setIsDesignConfirmed(false);
      setConfirmedCustomerNail(null);
      setDesignActionError(message);
      toast.error(message);
    } finally {
      setIsConfirmingDesign(false);
    }
  };

  const handleOpenUpdateBookingDesign = async () => {
    if (!isDesignConfirmed || isUpdatingBookingDesign) {
      return;
    }

    if (!isUuidLike(resolvedBookingApiId)) {
      setDesignActionError("A valid booking ID is required before updating the booking.");
      return;
    }

    setIsUpdatingBookingDesign(true);
    setDesignActionError("");
    setDesignActionSuccess("");

    try {
      const nextBookingDetail = bookingDetail ?? await fetchStaffBookingDetail(resolvedBookingApiId);

      if (!nextBookingDetail) {
        throw new Error("Booking detail is not available for update.");
      }

      const nextCustomerNailId = isVariantSelectionMode
        ? null
        : toNullableNumber(confirmedCustomerNail?.customerNailId);
      const nextNailVariantId = isVariantSelectionMode ? resolvedSelectedVariantId : null;

      if (!nextNailVariantId && !nextCustomerNailId) {
        throw new Error("Please confirm a nail variant or create a custom nail before updating the booking.");
      }

      const existingBookingItems = Array.isArray(nextBookingDetail?.bookingItems) ? nextBookingDetail.bookingItems : [];
      const baseNailItems = existingBookingItems.filter(isNailLinkedBookingItem);
      const existingServiceItems = existingBookingItems.filter((item) => !isNailLinkedBookingItem(item));
      const fallbackNailItem = baseNailItems[0] || existingBookingItems[0] || null;
      const payloadNailItemsSource = baseNailItems.length > 0 ? baseNailItems : [fallbackNailItem].filter(Boolean);
      const replacementNailItems = (payloadNailItemsSource.length > 0
        ? payloadNailItemsSource
        : [{
          quantity: 1,
          serviceId: null,
          shapeMethodConfigId: null,
          nailVariantId: null,
          customerNailRequestId: null,
          customerNailId: null,
        }]).map((item) => ({
          nailVariantId: nextNailVariantId,
          serviceId: toNullableUuid(item?.serviceId),
          shapeMethodConfigId: null,
          customerNailId: nextCustomerNailId,
          customerNailRequestId: null,
          quantity: Number(item?.quantity || 1) || 1,
        }));
      const preservedServiceItems = existingServiceItems
        .map((item) => buildServiceOnlyBookingItem(item))
        .filter((item) => item.serviceId);
      const mergedServiceItemsMap = new Map(
        preservedServiceItems.map((item) => [item.serviceId, item]),
      );

      selectedExtraOptions.forEach((item) => {
        const serviceId = toNullableUuid(item.id);

        if (!serviceId || mergedServiceItemsMap.has(serviceId)) {
          return;
        }

        mergedServiceItemsMap.set(serviceId, buildServiceOnlyBookingItem({ serviceId, quantity: 1 }));
      });

      const payloadBookingItems = [
        ...replacementNailItems,
        ...mergedServiceItemsMap.values(),
      ];

      const updatedBooking = await updateStaffBooking(resolvedBookingApiId, {
        bookingDate: nextBookingDetail.bookingDate,
        startTime: nextBookingDetail.startTime,
        nailArtistId: toNullableUuid(
          nextBookingDetail.nailArtistId
          || nextBookingDetail.artistId
          || loadAuthSession()?.user?.staffId
          || loadAuthSession()?.staffId,
        ),
        bookingItems: payloadBookingItems,
      });

      setBookingDetail(updatedBooking);
      setDesignActionSuccess(
        isVariantSelectionMode
          ? "Booking updated successfully with the selected nail variant."
          : "Booking updated successfully with the new customer nail design.",
      );
      toast.success(
        isVariantSelectionMode
          ? "Booking updated successfully with the selected nail variant."
          : "Booking updated successfully with the new customer nail design.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update booking design.";
      setDesignActionError(message);
      toast.error(message);
    } finally {
      setIsUpdatingBookingDesign(false);
    }
  };

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f9_100%)]">
      <div className="rounded-[24px] border border-[#f6dbe8] bg-[#fff7fb] p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
        <div className="space-y-4">
          <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#80687d]" />
              <input
                type="text"
                value={designQuery}
                onChange={(event) => setDesignQuery(event.target.value)}
                placeholder="Search nails designs..."
                className="h-11 w-full rounded-[12px] border border-[#f4dbe7] bg-[#fffafc] pl-11 pr-4 text-sm text-[#594456] outline-none transition focus:border-[#ef6aac]"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {studio.filters.map((filter, index) => (
                <Pill key={filter} active={index === 0}>
                  {filter}
                </Pill>
              ))}
            </div>
          </article>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(430px,0.44fr)]">
            <div className="space-y-4">
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#38253a]">Ready-Made Design Templates</h2>
                    <p className="mt-1 text-[11px] text-[#a8899c]">
                      {designView === "designs"
                        ? "Select a template to view its available variants"
                        : "Review the variants for the selected design"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {designView !== "designs" ? (
                      <button
                        type="button"
                        onClick={handleBackToDesigns}
                        className="rounded-full border border-[#f2bfd4] bg-[#fff4f8] px-3 py-1.5 text-[11px] font-bold text-[#ea4f93]"
                      >
                        ← Back to designs
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleToggleShowAllDesigns}
                      className="text-[11px] font-bold text-[#ea4f93]"
                    >
                      {designView === "designs"
                        ? showAllDesigns
                          ? "Show preview mode"
                          : `See all ${designTemplates.length} designs`
                        : `${designVariants.length} variants`}
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-medium text-[#b48ba0]">
                    {designView === "designs"
                      ? showAllDesigns
                        ? `Showing all ${designTemplates.length} designs`
                        : `Showing ${Math.min(templateWindowSize, designTemplates.length)} preview templates at a time`
                      : `Showing ${designVariants.length} variant${designVariants.length === 1 ? "" : "s"}`}
                  </p>
                  <p className="text-[11px] font-bold text-[#ea4f93]">
                    {designView === "designs"
                      ? showAllDesigns
                        ? `${designTemplates.length} templates`
                        : designTemplates.length > templateWindowSize
                          ? `${templateStartIndex + 1}-${Math.min(
                            templateStartIndex + templateWindowSize,
                            designTemplates.length,
                          )} of ${designTemplates.length}`
                          : `${designTemplates.length} templates`
                      : `${designVariants.length} variants`}
                  </p>
                </div>
                {designError ? (
                  <p className="mt-3 text-[11px] font-semibold text-[#d14c84]">{designError}</p>
                ) : null}
                <div className="relative mt-5">
                  {designView === "designs" && !showAllDesigns && designTemplates.length > templateWindowSize ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTemplateSlide("prev")}
                        className="absolute -left-5 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] shadow-[0_12px_24px_rgba(236,72,153,0.12)] transition hover:bg-[#fff1f7] xl:inline-flex"
                        aria-label="Show previous nail templates"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTemplateSlide("next")}
                        className="absolute -right-5 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] shadow-[0_12px_24px_rgba(236,72,153,0.12)] transition hover:bg-[#fff1f7] xl:inline-flex"
                        aria-label="Show next nail templates"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {designView === "designs" ? (
                      isDesignsLoading ? (
                        <p className="text-[11px] font-semibold text-[#a8899c] sm:col-span-2 xl:col-span-3">
                          Loading nail designs from the API...
                        </p>
                      ) : (
                        visibleTemplates.map((item) => (
                          <TemplateCard
                            key={item.id}
                            item={item}
                            isSelected={item.id === selectedTemplateId}
                            onSelect={() => void applyTemplatePreset(item.id)}
                          />
                        ))
                      )
                    ) : isVariantsLoading ? (
                      <p className="text-[11px] font-semibold text-[#a8899c] sm:col-span-2 xl:col-span-3">
                        Loading variants...
                      </p>
                    ) : (
                      visibleTemplates.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => void handleVariantSelect(item.id)}
                          className={`overflow-hidden rounded-[20px] border bg-white text-left shadow-[0_10px_24px_rgba(236,72,153,0.08)] ${selectedVariantId === String(item.id)
                            ? "border-[#ef6aac] ring-2 ring-[#ef6aac]/20"
                            : "border-[#f4dbe7]"
                            }`}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-28 w-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="p-3">
                            <h3 className="text-xs font-extrabold text-[#38253a]">{item.name}</h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.tags.map((tag) => (
                                <span key={tag} className="rounded-md bg-[#fff1f7] px-2 py-1 text-[9px] font-bold text-[#ea4f93]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="mt-4 flex items-end justify-between gap-3">
                              <div>
                                <p className="text-sm font-extrabold text-[#ea4f93]">{item.price}</p>
                                <p className="mt-1 text-[10px] text-[#ae8da0]">{item.duration}</p>
                              </div>
                              <span className="rounded-md bg-[#f3f1ff] px-2 py-1 text-[9px] font-extrabold text-[#7d5ce6]">
                                {selectedVariantId === String(item.id) ? "Selected" : "Variant"}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-extrabold text-[#38253a]">Layer-Based Custom Builder</h2>
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold ${selectedVariantId
                      ? "border-orange-200 bg-orange-100 text-orange-600"
                      : "border-green-200 bg-green-100 text-green-600"
                      }`}
                  >
                    {selectedVariantId ? "Variant Selected" : "Customizing"}
                  </span>
                </div>

                <div className="mt-6 space-y-6">
                  {!isVariantSelectionMode ? (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">0</span>
                        <p className="text-xs font-extrabold text-[#ea4f93]">Nail Name</p>
                      </div>
                      <input
                        type="text"
                        value={customerNailNameDraft}
                        onChange={(event) => setCustomerNailNameDraft(event.target.value)}
                        placeholder={suggestedCustomerNailName}
                        className="h-11 w-full rounded-[14px] border border-[#f4dbe7] bg-[#fff8fc] px-4 text-sm font-semibold text-[#5f4256] outline-none transition focus:border-[#ef6aac]"
                      />
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">1</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Nail Shape</p>
                    </div>
                    {builderCatalogError ? <p className="mb-3 text-[11px] font-semibold text-[#d14c84]">{builderCatalogError}</p> : null}
                    <ChoiceGrid
                      items={shapeFamilyOptions.length ? shapeFamilyOptions : studio.builder.shapes}
                      selected={selectedShape}
                      onSelect={handleShapeSelect}
                      type="shape"
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">2</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Nail Length</p>
                    </div>
                    <ChoiceGrid
                      items={lengthVariantOptions.length ? lengthVariantOptions : [{ label: selectedLength || "Short", variantLabel: selectedShape }]}
                      selected={selectedLength}
                      onSelect={handleLengthSelect}
                      type="length"
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">3</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Finger Colors</p>
                    </div>
                    <div className="space-y-4 rounded-[18px] border border-[#f4dbe7] bg-[#fff8fc] p-4">
                      <div>
                        <p className="mb-3 text-[10px] font-extrabold text-[#ea4f93]">Choose fingers first</p>
                        <div className="flex flex-wrap gap-2">
                          <Pill
                            active={selectedColorFingerIndices.length === NAIL_LABELS.length}
                            onClick={() => setSelectedColorFingerIndices([0, 1, 2, 3, 4])}
                          >
                            All fingers
                          </Pill>
                          {NAIL_LABELS.map((label, index) => (
                            <Pill
                              key={`color-finger-${label}`}
                              active={selectedColorFingerIndices.includes(index)}
                              onClick={() => {
                                setSelectedColorFingerIndices((current) => {
                                  if (current.includes(index)) {
                                    const next = current.filter((item) => item !== index);
                                    return next.length > 0 ? next : [index];
                                  }

                                  return [...current, index];
                                });
                              }}
                            >
                              {label}
                            </Pill>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Pill
                          active={selectedColorMode === "solid"}
                          onClick={() => updateFingerColors((item) => ({ ...item, mode: "solid" }))}
                        >
                          Solid
                        </Pill>
                        <Pill
                          active={selectedColorMode === "gradient"}
                          onClick={() => updateFingerColors((item) => ({
                            ...item,
                            mode: "gradient",
                            gradientStops: normalizeFingerColorConfig(item).gradientStops,
                          }))}
                        >
                          Gradient
                        </Pill>
                      </div>
                      {selectedColorMode === "gradient" ? (
                        <div className="space-y-3 rounded-[14px] border border-[#f4dbe7] bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-extrabold text-[#ea4f93]">Gradient Stops</p>
                              <p className="mt-1 text-[10px] text-[#a98c9f]">Add multiple colors for rainbow-style nails.</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddGradientStop}
                              className="rounded-full border border-[#f2bfd4] bg-[#fff5fa] px-3 py-1 text-[10px] font-extrabold text-[#ea4f93]"
                            >
                              + Add color
                            </button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {selectedGradientStops.map((stopColor, stopIndex) => (
                              <label
                                key={`gradient-stop-${stopIndex}`}
                                className="rounded-[14px] border border-[#f4dbe7] bg-[#fffafd] p-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-extrabold text-[#ea4f93]">
                                    Stop {stopIndex + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGradientStop(stopIndex)}
                                    disabled={selectedGradientStops.length <= 2}
                                    className="text-[10px] font-bold text-[#c48aa4] disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={stopColor}
                                    onChange={(event) => handleGradientStopChange(stopIndex, event.target.value)}
                                    className="h-10 w-14 cursor-pointer rounded-md border border-[#f2bfd4] bg-white p-1"
                                  />
                                  <div>
                                    <p className="text-[10px] font-bold text-[#38253a]">{stopColor.toUpperCase()}</p>
                                    <p className="mt-1 text-[10px] text-[#a98c9f]">{hexToRgbLabel(stopColor)}</p>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="rounded-[14px] border border-[#f4dbe7] bg-white p-3">
                            <span className="text-[10px] font-extrabold text-[#ea4f93]">Primary Color</span>
                            <div className="mt-3 flex items-center gap-3">
                              <input
                                type="color"
                                value={selectedPrimaryColor}
                                onChange={(event) => updateFingerColors((item) => ({
                                  ...item,
                                  primaryColor: event.target.value,
                                  gradientStops: [
                                    event.target.value,
                                    normalizeFingerColorConfig(item).gradientStops[1] || event.target.value,
                                    ...normalizeFingerColorConfig(item).gradientStops.slice(2),
                                  ],
                                }))}
                                className="h-10 w-14 cursor-pointer rounded-md border border-[#f2bfd4] bg-white p-1"
                              />
                              <div>
                                <p className="text-[10px] font-bold text-[#38253a]">{selectedPrimaryColor.toUpperCase()}</p>
                                <p className="mt-1 text-[10px] text-[#a98c9f]">{hexToRgbLabel(selectedPrimaryColor)}</p>
                              </div>
                            </div>
                          </label>
                        </div>
                      )}
                      <div className="rounded-[14px] border border-dashed border-[#f2bfd4] bg-white p-3">
                        <p className="text-[10px] font-bold text-[#a98c9f]">Live Color Formula</p>
                        <div className="mt-2 flex items-center gap-3">
                          <span
                            className="h-10 w-10 rounded-full border border-[#f2bfd4]"
                            style={selectedColorMode === "gradient"
                              ? { backgroundImage: buildGradientStyle(selectedGradientStops) }
                              : { backgroundColor: selectedPrimaryColor }}
                          />
                          <div>
                            <p className="text-[10px] font-extrabold text-[#ea4f93]">{selectedColorMode === "gradient" ? "Gradient RGB" : "Solid RGB"}</p>
                            <p className="mt-1 text-[10px] text-[#38253a]">{selectedColor}</p>
                            <p className="mt-1 text-[10px] text-[#a98c9f]">
                              Applying to {selectedColorFingerIndices.length === NAIL_LABELS.length
                                ? "all fingers"
                                : selectedColorFingerIndices.map((index) => NAIL_LABELS[index]).join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">4</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Finish / Texture</p>
                    </div>
                    <ChoiceGrid
                      items={surfaceOptions.length ? surfaceOptions : studio.builder.finishes}
                      selected={[selectedFinish]}
                      onSelect={handleFinishSelect}
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">5</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Decorations</p>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Pill
                        active={activeNailIndex === -1}
                        onClick={() => setActiveNailIndex(-1)}
                      >
                        All fingers
                      </Pill>
                      {NAIL_LABELS.map((label, index) => (
                        <Pill
                          key={label}
                          active={activeNailIndex === index}
                          onClick={() => setActiveNailIndex(index)}
                        >
                          {label}
                        </Pill>
                      ))}
                    </div>
                    <p className="mb-3 text-[10px] font-bold text-[#b07d97]">
                      Editing decoration for {activeNailIndex === -1 ? "all fingers" : `${NAIL_LABELS[activeNailIndex]} nail`}
                    </p>
                    <ChoiceGrid
                      items={decorationOptions.length ? decorationOptions : studio.builder.decorations}
                      selected={selectedDecorations}
                      onSelect={toggleNailDecoration}
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">6</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Extra Services</p>
                    </div>
                    <ChoiceGrid
                      items={extraServiceOptions.length ? extraServiceOptions : studio.builder.extras}
                      selected={selectedExtras}
                      onSelect={(value) => toggleArraySelection(value, selectedExtras, setSelectedExtras)}
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-[18px] border border-[#f2bfd4] bg-[linear-gradient(135deg,#fff6fa_0%,#ffeef7_100%)] p-4">
                  <SectionTitle icon={Star} title="Price & Duration Estimation" />
                  <div className="mt-4 space-y-3 text-sm text-[#8a6f83]">
                    {isBuilderCatalogLoading ? (
                      <p className="text-[11px] font-semibold text-[#a8899c]">Loading builder options from API...</p>
                    ) : estimationRows.length > 0 ? (
                      estimationRows.map((item) => (
                        <div key={item.key} className="flex items-center justify-between gap-3 border-b border-[#f6d8e7] pb-2">
                          <div>
                            <p>{item.label}</p>
                            <p className="mt-1 text-[10px] text-[#b48aa0]">{formatDurationLabel(item.duration)}</p>
                          </div>
                          <span className="font-bold text-[#ea4f93]">{formatCurrencyValue(item.price)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] font-semibold text-[#a8899c]">Select shape, finish, decorations, and extra services to see the estimate.</p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-base font-extrabold text-[#38253a]">Estimated Total</p>
                    <p className="text-[1.6rem] font-extrabold text-green-600">{totalEstimatedPriceLabel}</p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#d34f88]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ea4f93]" />
                    Estimated Duration: {totalEstimatedDurationLabel}
                  </div>
                </div>

                {designActionError || designActionSuccess || bookingDetailError ? (
                  <div className={`mt-4 rounded-[14px] border px-4 py-3 text-[11px] font-semibold ${designActionError || bookingDetailError
                    ? "border-[#f4c7d7] bg-[#fff1f6] text-[#c33f79]"
                    : "border-[#bde7d2] bg-[#effbf4] text-[#178a58]"
                    }`}>
                    {designActionError || bookingDetailError || designActionSuccess}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleOpenUpdateBookingDesign}
                    disabled={!isDesignConfirmed || isUpdatingBookingDesign || isConfirmingDesign}
                    className={`rounded-[12px] px-4 py-3 text-xs font-bold transition ${isDesignConfirmed && !isUpdatingBookingDesign && !isConfirmingDesign
                      ? "bg-[image:var(--gradient-accent)] text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
                      : "cursor-not-allowed border border-[#f2bfd4] bg-[#fff4f8] text-[#c7a0b4]"
                      }`}
                  >
                    {isUpdatingBookingDesign ? "Updating Booking..." : "Update Booking Design"}
                  </button>
                  <button
                    type="button"
                    className="rounded-[12px] border border-[#f2bfd4] bg-white px-4 py-3 text-xs font-bold text-[#ea4f93]"
                  >
                    Save Design
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDesign}
                    disabled={isConfirmingDesign || !selectedShapeOption || !selectedSurfaceOption}
                    className={`rounded-[12px] px-4 py-3 text-xs font-bold text-white shadow-[0_12px_24px_rgba(17,184,121,0.18)] ${isConfirmingDesign || !selectedShapeOption || !selectedSurfaceOption
                      ? "cursor-not-allowed bg-[#9fd9bf]"
                      : "bg-[linear-gradient(135deg,#37d999_0%,#11b879_100%)]"
                      }`}
                  >
                    {isConfirmingDesign
                      ? "Creating Nail..."
                      : isDesignConfirmed
                        ? isVariantSelectionMode
                          ? "Variant Confirmed"
                          : "Design Confirmed"
                        : isVariantSelectionMode
                          ? "Confirm Variant"
                          : "Confirm Design"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(detailRoute)}
                    className="rounded-[12px] border border-[#ded2da] bg-white px-4 py-3 text-xs font-bold text-[#846e7f]"
                  >
                    Back to Booking Detail
                  </button>
                </div>
              </article>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4">
                <SectionTitle icon={Palette} title="Live Nail Preview" />
                <InteractiveStudioPreview
                  previewRef={previewContainerRef}
                  finish={selectedFinish}
                  shape={selectedShape}
                  length={selectedLength}
                  shapeImageUrl={selectedShapeOption?.imageUrl || ""}
                  fingerColorConfigs={fingerColorConfigs}
                  componentPlacements={componentPlacements}
                  activeNailIndex={activeNailIndex}
                  selectedPlacementKey={selectedPlacementKey}
                  selectedPlacement={selectedPlacement}
                  activeFingerPlacements={activeFingerPlacements}
                  activeTemplateName={resolvedActiveTemplate.name}
                  selectedShape={selectedShape}
                  selectedLength={selectedLength}
                  selectedColor={selectedColor}
                  selectedFinish={selectedFinish}
                  selectedDecorations={selectedDecorations}
                  onSelectNail={handlePreviewNailSelect}
                  onSelectPlacement={setSelectedPlacementKey}
                  onPlacementChange={updatePlacementConfig}
                />
                <div className="mt-4 rounded-[12px] border border-[#f2bfd4] bg-white/70 px-3 py-2 text-center text-[10px] font-bold text-[#b07d97]">
                  {isDesignConfirmed
                    ? isVariantSelectionMode
                      ? "Variant confirmed. Update Booking Design is now ready."
                      : "Custom nail confirmed. Update Booking Design is now ready."
                    : "Confirm Design first to unlock Update Booking Design."}
                </div>
              </article>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

