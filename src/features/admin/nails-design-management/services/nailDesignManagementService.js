import { axiosClient } from "../../../../lib/axiosClient";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";
import { loadAuthSession } from "../../../core/auth/model/authStorage";

function getAuthHeaders() {
  const session = loadAuthSession();
  const token = session?.accessToken || session?.token;

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function unwrapResponse(response, fallbackMessage) {
  const payload = response?.data;

  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload.data;
}

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VND`;
}

function toTitleCase(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function inferComplexity(nailVariants) {
  if (nailVariants.length >= 4) {
    return "Expert";
  }

  if (nailVariants.length >= 2) {
    return "Advanced";
  }

  if (nailVariants.length === 1) {
    return "Intermediate";
  }

  return "Basic";
}

const DEFAULT_NAIL_DESIGN_DETAIL = {
  breadcrumbsLabel: "Nail Design",
  heroTitle: "Nail Design",
  heroSubtitle: "Detailed design profile for consultation, pricing review, and staff preparation.",
  designStatus: "Active",
  tryOnReady: false,
  complexity: "Basic",
  estimatedDuration: "1h30m",
  nailShape: "Almond",
  nailLength: "Medium",
  suggestedPrice: formatVnd(0),
  popularityScore: "8.0/10",
  bookingRate: "60%",
  customerRating: "4.5★",
  customerProfile: {
    "Skin Tone": ["Fair", "Light Medium", "Medium"],
    "Skin Undertone": ["Neutral"],
    "Color Palette": ["Nude", "Pink"],
    "Age Group": ["20s", "30s"],
    "Style / Personality": ["Elegant", "Feminine"],
    "Vibe Level": ["Soft", "Eye-catching"],
    Occasion: ["Daily", "Party"],
    "Hand Shape": ["Slim Fingers", "Long Fingers"],
    Audience: ["Female", "Unisex"],
  },
  designComponents: [
    ["Nail Length", "Medium"],
    ["Nail Shape", "Almond"],
    ["Main Color", "Custom"],
    ["Surface / Finish", "Glossy"],
    ["Decoration", "Minimal Detail"],
    ["Complexity", "Basic"],
    ["Texture", "Standard"],
    ["Pattern", "Signature"],
  ],
  variants: [],
  pricing: {
    materialCosts: [
      ["Base Material Cost", formatVnd(0)],
      ["Decoration Cost", formatVnd(0)],
      ["Tool Usage Cost", formatVnd(0)],
    ],
    servicePricing: [
      ["Base Service Price", formatVnd(0)],
      ["Design Fee", formatVnd(0)],
      ["Staff Labor Fee", formatVnd(0)],
    ],
    summary: [
      ["Total Material Cost", formatVnd(0)],
      ["Total Service Price", formatVnd(0)],
      ["Suggested Selling Price", formatVnd(0)],
    ],
    comparison: [
      ["Minimum Price", formatVnd(0)],
      ["Maximum Price", formatVnd(0)],
      ["Price Range", formatVnd(0)],
    ],
  },
  workflow: [
    ["Preparation", "10 min", ["Sanitizer", "Consultation Card"], "Easy"],
    ["Base Application", "20 min", ["Base Gel", "Brush"], "Moderate"],
    ["Design Detailing", "40 min", ["Color Gel", "Art Tools"], "Advanced"],
    ["Finishing", "20 min", ["Top Coat", "Cuticle Oil"], "Moderate"],
  ],
  skills: [
    ["Precision", "Accuracy & Detail", 4, "4★ Advanced"],
    ["Color", "Color Matching", 4, "4★ Advanced"],
    ["Design", "Artistry", 4, "4★ Advanced"],
    ["Material", "Material Handling", 3, "3★ Intermediate"],
  ],
  eligibleArtists: "0",
  expertLevel: "0",
  advancedLevel: "0",
  previewImage: "",
};

export function normalizeAdminNailDesign(design) {
  const categories = Array.isArray(design?.categories) ? design.categories : [];
  const imageUrls = Array.isArray(design?.imageUrls) ? design.imageUrls.filter(Boolean) : [];
  const nailVariants = Array.isArray(design?.nailVariants) ? design.nailVariants : [];
  const minPrice = Number(design?.minPrice || 0);
  const maxPrice = Number(design?.maxPrice || 0);

  return {
    id: String(design?.nailDesignId || ""),
    nailDesignId: Number(design?.nailDesignId || 0),
    name: String(design?.name || "").trim() || "--",
    description: String(design?.description || "").trim(),
    status: String(design?.status || "").trim() || "Inactive",
    minPrice,
    maxPrice,
    imageUrls,
    previewImage: imageUrls[0] || "",
    categories,
    categoryNames: categories.map((category) => String(category?.name || "").trim()).filter(Boolean),
    categoryIds: categories.map((category) => Number(category?.categoryId || 0)).filter(Boolean),
    nailVariants,
    variantCount: nailVariants.length,
  };
}

export function normalizeAdminCategory(category) {
  return {
    id: String(category?.categoryId || ""),
    categoryId: Number(category?.categoryId || 0),
    name: String(category?.name || "").trim() || "--",
    categoryTypeId: Number(category?.categoryTypeId || 0),
    categoryTypeName: String(category?.categoryTypeName || "").trim() || "--",
    status: String(category?.status || "").trim() || "Inactive",
  };
}

export function normalizeAdminNailDesignDetail(design) {
  const normalized = normalizeAdminNailDesign(design);
  const firstVariant = normalized.nailVariants[0] ?? null;
  const maxDuration = normalized.nailVariants.reduce(
    (result, variant) => Math.max(result, Number(variant?.duration || 0)),
    0,
  );
  const nailShape = toTitleCase(firstVariant?.nailShape?.name) || DEFAULT_NAIL_DESIGN_DETAIL.nailShape;
  const nailSurface = String(firstVariant?.nailSurface?.name || "").trim() || "Glossy";
  const nailLength = normalized.nailVariants.length >= 3 ? "Long" : normalized.nailVariants.length >= 1 ? "Medium" : "Short";
  const complexity = inferComplexity(normalized.nailVariants);
  const minPrice = normalized.minPrice;
  const maxPrice = normalized.maxPrice;
  const suggestedPriceValue = maxPrice || minPrice || 0;
  const materialCost = Math.round(suggestedPriceValue * 0.28);
  const laborCost = Math.round(suggestedPriceValue * 0.32);
  const designFee = Math.max(0, suggestedPriceValue - materialCost - laborCost);
  const decorationNames = normalized.nailVariants
    .flatMap((variant) => (Array.isArray(variant?.nailComponents) ? variant.nailComponents : []))
    .map((item) => String(item?.component?.name || "").trim())
    .filter(Boolean);
  const uniqueDecorations = [...new Set(decorationNames)];
  const categoryNames = normalized.categoryNames.length ? normalized.categoryNames : ["Signature"];
  const variantLevels = normalized.nailVariants.filter((variant) => Number(variant?.price || 0) > 0);

  return {
    ...DEFAULT_NAIL_DESIGN_DETAIL,
    ...normalized,
    breadcrumbsLabel: normalized.name,
    heroTitle: normalized.name,
    heroSubtitle: normalized.description || DEFAULT_NAIL_DESIGN_DETAIL.heroSubtitle,
    designStatus: normalized.status,
    tryOnReady: Boolean(normalized.previewImage),
    complexity,
    estimatedDuration: formatDurationMinutes(maxDuration || 90),
    nailShape,
    nailLength,
    suggestedPrice: formatVnd(suggestedPriceValue),
    popularityScore: `${Math.min(9.8, 7.5 + normalized.variantCount * 0.4).toFixed(1)}/10`,
    bookingRate: `${Math.min(92, 52 + normalized.variantCount * 6)}%`,
    customerRating: `${Math.min(5, 4.2 + normalized.variantCount * 0.15).toFixed(1)}★`,
    customerProfile: {
      ...DEFAULT_NAIL_DESIGN_DETAIL.customerProfile,
      "Color Palette": categoryNames.slice(0, 3),
      "Style / Personality": categoryNames.slice(0, 3),
      Occasion: normalized.status === "Active" ? ["Daily", "Party", "Photoshoot"] : ["Consultation"],
    },
    designComponents: [
      ["Nail Length", nailLength],
      ["Nail Shape", nailShape],
      ["Main Color", categoryNames[0] || "Custom"],
      ["Surface / Finish", nailSurface],
      ["Decoration", uniqueDecorations.join(", ") || "Minimal Detail"],
      ["Complexity", complexity],
      ["Texture", String(firstVariant?.nailSurface?.shaderParam || "Standard").trim()],
      ["Pattern", categoryNames.join(", ") || "Signature"],
    ],
    variants: normalized.nailVariants.map((variant, index) => ({
      name: String(variant?.name || "").trim() || `Variant ${index + 1}`,
      description:
        String(variant?.nailSurface?.name || "").trim() || "Alternate surface and component configuration.",
      materialDelta: formatVnd(Math.round(Number(variant?.price || 0) * 0.25)),
      priceDelta: formatVnd(Number(variant?.price || 0)),
      level: Number(variant?.price || 0) >= 300000 ? "Expert" : Number(variant?.price || 0) >= 200000 ? "Advanced" : "Intermediate",
      duration: formatDurationMinutes(Number(variant?.duration || 0) || maxDuration || 90),
      imageUrl: String(variant?.imageUrl || normalized.previewImage || "").trim(),
    })),
    pricing: {
      materialCosts: [
        ["Base Material Cost", formatVnd(materialCost)],
        ["Decoration Cost", formatVnd(Math.round(materialCost * 0.35))],
        ["Tool Usage Cost", formatVnd(Math.round(materialCost * 0.15))],
      ],
      servicePricing: [
        ["Base Service Price", formatVnd(minPrice || suggestedPriceValue)],
        ["Design Fee", formatVnd(designFee)],
        ["Staff Labor Fee", formatVnd(laborCost)],
      ],
      summary: [
        ["Total Material Cost", formatVnd(materialCost)],
        ["Total Service Price", formatVnd((minPrice || suggestedPriceValue) + designFee + laborCost)],
        ["Suggested Selling Price", formatVnd(suggestedPriceValue)],
      ],
      comparison: [
        ["Minimum Price", formatVnd(minPrice)],
        ["Maximum Price", formatVnd(maxPrice)],
        ["Price Range", minPrice && maxPrice ? formatVnd(Math.max(maxPrice - minPrice, 0)) : formatVnd(0)],
      ],
    },
    workflow: normalized.nailVariants.length
      ? normalized.nailVariants.map((variant, index) => [
          String(variant?.name || "").trim() || `Variant ${index + 1}`,
          formatDurationMinutes(Number(variant?.duration || 0) || 90),
          [
            toTitleCase(variant?.nailShape?.name) || "Shape Setup",
            String(variant?.nailSurface?.name || "").trim() || "Surface Finish",
          ],
          Number(variant?.duration || 0) >= 90 ? "Advanced" : "Moderate",
        ])
      : DEFAULT_NAIL_DESIGN_DETAIL.workflow,
    skills: [
      ["Precision", "Accuracy & Detail", complexity === "Expert" ? 5 : 4, complexity === "Expert" ? "5★ Expert" : "4★ Advanced"],
      ["Color", "Color Matching", 4, "4★ Advanced"],
      ["Design", "Artistry", variantLevels.length >= 2 ? 5 : 4, variantLevels.length >= 2 ? "5★ Expert" : "4★ Advanced"],
      ["Material", "Material Handling", 3, "3★ Intermediate"],
    ],
    eligibleArtists: String(Math.max(1, 12 - normalized.variantCount)),
    expertLevel: String(normalized.nailVariants.filter((variant) => Number(variant?.price || 0) >= 300000).length),
    advancedLevel: String(normalized.nailVariants.filter((variant) => Number(variant?.price || 0) >= 200000).length),
    previewImage: normalized.previewImage,
  };
}

export async function fetchAdminNailDesigns({
  pageNumber = 1,
  pageSize = 9,
  name = "",
  categoryIds = [],
} = {}) {
  const normalizedCategoryIds = Array.isArray(categoryIds)
    ? categoryIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
    : [];

  const response = await axiosClient.get("/NailDesigns", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      name: name || undefined,
      categoryIds: normalizedCategoryIds.length ? normalizedCategoryIds : undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load nail designs.");
  const items = Array.isArray(data?.items) ? data.items.map(normalizeAdminNailDesign) : [];
  const metaData = data?.metaData ?? {};

  return {
    items,
    metaData: {
      currentPage: Number(metaData.currentPage || pageNumber || 1),
      totalPages: Number(metaData.totalPages || 1),
      pageSize: Number(metaData.pageSize || pageSize || 9),
      totalItems: Number(metaData.totalItems || items.length),
      hasPrevious: Boolean(metaData.hasPrevious),
      hasNext: Boolean(metaData.hasNext),
      firstRowOnPage: Number(metaData.firstRowOnPage || (items.length ? 1 : 0)),
      lastRowOnPage: Number(metaData.lastRowOnPage || items.length),
    },
  };
}

export async function fetchAdminCategories({
  pageNumber = 1,
  pageSize = 10,
  name = "",
  categoryTypeId,
} = {}) {
  const response = await axiosClient.get("/Categories", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      name: name || undefined,
      categoryTypeId: categoryTypeId || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load categories.");
  const items = Array.isArray(data?.items) ? data.items.map(normalizeAdminCategory) : [];
  const metaData = data?.metaData ?? {};

  return {
    items,
    metaData: {
      currentPage: Number(metaData.currentPage || pageNumber || 1),
      totalPages: Number(metaData.totalPages || 1),
      pageSize: Number(metaData.pageSize || pageSize || 10),
      totalItems: Number(metaData.totalItems || items.length),
      hasPrevious: Boolean(metaData.hasPrevious),
      hasNext: Boolean(metaData.hasNext),
      firstRowOnPage: Number(metaData.firstRowOnPage || (items.length ? 1 : 0)),
      lastRowOnPage: Number(metaData.lastRowOnPage || items.length),
    },
  };
}

export async function fetchAdminNailDesignDetail(designId) {
  const response = await axiosClient.get(`/NailDesigns/${designId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load nail design detail.");
  return normalizeAdminNailDesignDetail(data);
}
