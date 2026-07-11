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
  return `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;
}

function normalizeIntegerId(value, fallback = 0) {
  const normalizedValue = Number(value);

  if (!Number.isInteger(normalizedValue) || normalizedValue < 0) {
    return fallback;
  }

  return normalizedValue;
}

function toTitleCase(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeLookupKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function getVariantLevel(price) {
  const normalizedPrice = Number(price || 0);

  if (normalizedPrice >= 300000) {
    return "Expert";
  }

  if (normalizedPrice >= 200000) {
    return "Advanced";
  }

  return "Intermediate";
}

function buildVariantDescription(variant) {
  const surfaceName = String(variant?.nailSurface?.name || "").trim();
  const componentNames = Array.isArray(variant?.nailComponents)
    ? variant.nailComponents
        .map((item) => String(item?.component?.name || "").trim())
        .filter(Boolean)
    : [];

  if (surfaceName && componentNames.length) {
    return `${surfaceName} finish with ${componentNames.join(", ")} accessories.`;
  }

  if (surfaceName) {
    return `${surfaceName} finish with alternate component configuration.`;
  }

  if (componentNames.length) {
    return `Accessory set: ${componentNames.join(", ")}.`;
  }

  return "Alternate surface and component configuration.";
}

function normalizeAdminNailVariantDetail(variant) {
  const normalizedPrice = Number(variant?.price || 0);
  const normalizedDuration = Number(variant?.duration || 0);
  const nailComponents = Array.isArray(variant?.nailComponents) ? variant.nailComponents : [];

  return {
    id: String(variant?.nailVariantId || ""),
    nailVariantId: normalizeIntegerId(variant?.nailVariantId),
    name: String(variant?.name || "").trim() || "--",
    nailShapeId: normalizeIntegerId(variant?.nailShapeId),
    nailSurfaceId: normalizeIntegerId(variant?.nailSurfaceId),
    nailDesignId: normalizeIntegerId(variant?.nailDesignId),
    price: normalizedPrice,
    priceLabel: formatVnd(normalizedPrice),
    duration: normalizedDuration,
    durationLabel: formatDurationMinutes(normalizedDuration),
    imageUrl: String(variant?.imageUrl || "").trim(),
    colorJson: String(variant?.colorJson || "").trim(),
    description: buildVariantDescription(variant),
    nailShape: variant?.nailShape
      ? {
          nailShapeId: normalizeIntegerId(variant.nailShape.nailShapeId),
          name: toTitleCase(variant.nailShape.name) || "--",
          imageUrl: String(variant.nailShape.imageUrl || "").trim(),
          price: Number(variant.nailShape.price || 0),
          priceLabel: formatVnd(variant.nailShape.price || 0),
          duration: Number(variant.nailShape.duration || 0),
          durationLabel: formatDurationMinutes(Number(variant.nailShape.duration || 0)),
        }
      : null,
    nailSurface: variant?.nailSurface
      ? {
          nailSurfaceId: normalizeIntegerId(variant.nailSurface.nailSurfaceId),
          name: String(variant.nailSurface.name || "").trim() || "--",
          shaderParam: String(variant.nailSurface.shaderParam || "").trim(),
          lightnessOffset: Number(variant.nailSurface.lightnessOffset || 0),
          saturationOffset: Number(variant.nailSurface.saturationOffset || 0),
          hueOffset: Number(variant.nailSurface.hueOffset || 0),
          price: Number(variant.nailSurface.price || 0),
          priceLabel: formatVnd(variant.nailSurface.price || 0),
          duration: Number(variant.nailSurface.duration || 0),
          durationLabel: formatDurationMinutes(Number(variant.nailSurface.duration || 0)),
        }
      : null,
    nailComponents: nailComponents.map((item, index) => ({
      id: String(item?.nailComponentId || index + 1),
      nailComponentId: normalizeIntegerId(item?.nailComponentId),
      componentId: normalizeIntegerId(item?.componentId),
      posX: Number(item?.posX || 0),
      posY: Number(item?.posY || 0),
      fingerIndex: Number(item?.fingerIndex || 0),
      configJson: String(item?.configJson || "").trim(),
      component: item?.component
        ? {
            componentId: normalizeIntegerId(item.component.componentId),
            name: String(item.component.name || "").trim() || "--",
            imageUrl: String(item.component.imageUrl || "").trim(),
            componentType: String(item.component.componentType || "").trim() || "--",
            price: Number(item.component.price || 0),
            priceLabel: formatVnd(item.component.price || 0),
            duration: Number(item.component.duration || 0),
          }
        : null,
    })),
  };
}

function normalizeVariantProcedure(procedure, index = 0) {
  return {
    procedureId: String(procedure?.procedureId || "").trim(),
    name: String(procedure?.name || "").trim() || `Procedure ${index + 1}`,
    description: String(procedure?.description || "").trim(),
    duration: Number(procedure?.duration || 0),
    durationLabel: formatDurationMinutes(Number(procedure?.duration || 0)),
    status: String(procedure?.status || "").trim() || "--",
    createAt: String(procedure?.createAt || "").trim(),
    isRequired: Boolean(procedure?.isRequired),
    // Inference: assign order is initialized from API response position because GET schema does not expose stepOrder.
    stepOrder: index + 1,
  };
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
    "Category": ["Nude", "Pink"],
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
      "Category": categoryNames.slice(0, 3),
      "Style / Personality": categoryNames.slice(0, 3),
      Occasion: normalized.status === "Active" ? ["Daily", "Party", "Photoshoot"] : ["Consultation"],
    },
    designComponents: [
      ["Nail Length", nailLength],
      ["Nail Shape", nailShape],
      ["Category", categoryNames[0] || "Custom"],
      ["Surface / Finish", nailSurface],
      ["Decoration", uniqueDecorations.join(", ") || "Minimal Detail"],
      ["Complexity", complexity],
      ["Texture", String(firstVariant?.nailSurface?.shaderParam || "Standard").trim()],
      ["Pattern", categoryNames.join(", ") || "Signature"],
    ],
    variants: normalized.nailVariants.map((variant, index) => ({
      id: String(variant?.nailVariantId || index + 1),
      nailVariantId: Number(variant?.nailVariantId || 0),
      nailShapeId: normalizeIntegerId(variant?.nailShapeId),
      nailSurfaceId: normalizeIntegerId(variant?.nailSurfaceId),
      nailDesignId: normalizeIntegerId(variant?.nailDesignId, normalized.nailDesignId),
      name: String(variant?.name || "").trim() || `Variant ${index + 1}`,
      description: buildVariantDescription(variant),
      materialDelta: formatVnd(Math.round(Number(variant?.price || 0) * 0.25)),
      priceDelta: formatVnd(Number(variant?.price || 0)),
      level: getVariantLevel(variant?.price),
      duration: formatDurationMinutes(Number(variant?.duration || 0) || maxDuration || 90),
      rawDuration: Number(variant?.duration || 0) || maxDuration || 90,
      price: Number(variant?.price || 0),
      imageUrl: String(variant?.imageUrl || normalized.previewImage || "").trim(),
      colorJson: String(variant?.colorJson || "").trim(),
      nailShape: variant?.nailShape || null,
      nailSurface: variant?.nailSurface || null,
      nailComponents: Array.isArray(variant?.nailComponents) ? variant.nailComponents : [],
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
  const normalizedDesignId = Number(designId);
  const response = await axiosClient.get(`/NailDesigns/${designId}`, {
    headers: getAuthHeaders(),
  });
  const data = unwrapResponse(response, "Failed to load nail design detail.");

  if (!Number.isInteger(normalizedDesignId) || normalizedDesignId <= 0) {
    return normalizeAdminNailDesignDetail(data);
  }

  const variants = [];
  let pageNumber = 1;
  let hasNext = true;

  while (hasNext) {
    const variantsResponse = await axiosClient.get("/NailVariants", {
      headers: getAuthHeaders(),
      params: {
        pageNumber,
        pageSize: 100,
        nailDesignId: normalizedDesignId,
      },
    });
    const variantsData = unwrapResponse(variantsResponse, "Failed to load nail variants.");
    const items = Array.isArray(variantsData?.items) ? variantsData.items : [];
    const metaData = variantsData?.metaData ?? {};

    variants.push(...items);
    hasNext = Boolean(metaData.hasNext);
    pageNumber += 1;
  }

  return normalizeAdminNailDesignDetail({
    ...data,
    nailVariants: variants,
  });
}

export async function fetchAdminNailVariantReferences() {
  const shapesByName = new Map();
  const surfacesByName = new Map();
  let pageNumber = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await axiosClient.get("/NailShapes", {
      headers: getAuthHeaders(),
      params: {
        pageNumber,
        pageSize: 100,
      },
    });
    const data = unwrapResponse(response, "Failed to load nail variant references.");
    const items = Array.isArray(data?.items) ? data.items : [];
    const metaData = data?.metaData ?? {};

    items.forEach((shape) => {
      if (shape?.nailShapeId) {
        const normalizedName = normalizeLookupKey(shape.name);
        if (!normalizedName || shapesByName.has(normalizedName)) {
          return;
        }

        shapesByName.set(normalizedName, {
          nailShapeId: Number(shape.nailShapeId),
          name: String(shape.name || "").trim(),
          imageUrl: String(shape.imageUrl || "").trim(),
          price: Number(shape.price || 0),
          duration: Number(shape.duration || 0),
        });
      }
    });

    hasNext = Boolean(metaData.hasNext);
    pageNumber += 1;
  }

  pageNumber = 1;
  hasNext = true;

  while (hasNext) {
    const response = await axiosClient.get("/NailSurfaces", {
      headers: getAuthHeaders(),
      params: {
        pageNumber,
        pageSize: 100,
      },
    });
    const data = unwrapResponse(response, "Failed to load nail variant references.");
    const items = Array.isArray(data?.items) ? data.items : [];
    const metaData = data?.metaData ?? {};

    items.forEach((surface) => {
      if (surface?.nailSurfaceId) {
        const normalizedName = normalizeLookupKey(surface.name);
        if (!normalizedName || surfacesByName.has(normalizedName)) {
          return;
        }

        surfacesByName.set(normalizedName, {
          nailSurfaceId: Number(surface.nailSurfaceId),
          name: String(surface.name || "").trim(),
          shaderParam: String(surface.shaderParam || "").trim(),
          price: Number(surface.price || 0),
          duration: Number(surface.duration || 0),
        });
      }
    });

    hasNext = Boolean(metaData.hasNext);
    pageNumber += 1;
  }

  return {
    shapes: [...shapesByName.values()],
    surfaces: [...surfacesByName.values()],
  };
}

export async function createAdminNailDesign(designFormValues) {
  const formData = new FormData();
  formData.append("Name", String(designFormValues?.name || "").trim());
  formData.append("Description", String(designFormValues?.description || "").trim());

  const categoryIds = Array.isArray(designFormValues?.categoryIds)
    ? designFormValues.categoryIds
        .map((value) => normalizeIntegerId(value, -1))
        .filter((value) => value > 0)
    : [];

  categoryIds.forEach((value) => {
    formData.append("CategoryIds", String(value));
  });
  if (Array.isArray(designFormValues?.images)) {
    designFormValues.images.forEach((file) => {
      if (file instanceof File) {
        formData.append("images", file);
      }
    });
  }

  const response = await axiosClient.post("/NailDesigns", formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  const data = unwrapResponse(response, "Failed to create nail design.");
  return normalizeAdminNailDesign(data);
}

export async function createAdminNailVariant(variantFormValues) {
  const formData = new FormData();
  formData.append("Name", String(variantFormValues?.name || "").trim());
  formData.append("NailShapeId", String(normalizeIntegerId(variantFormValues?.nailShapeId)));
  formData.append("NailSurfaceId", String(normalizeIntegerId(variantFormValues?.nailSurfaceId)));
  formData.append("NailDesignId", String(normalizeIntegerId(variantFormValues?.nailDesignId)));
  formData.append("ColorJson", String(variantFormValues?.colorJson || "").trim());
  if (variantFormValues?.image instanceof File) {
    formData.append("image", variantFormValues.image);
  }

  const response = await axiosClient.post("/NailVariants", formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapResponse(response, "Failed to create nail variant.");
}

export async function updateAdminNailVariant(variantId, variantFormValues) {
  const normalizedVariantId = normalizeIntegerId(variantId, -1);

  if (normalizedVariantId <= 0) {
    throw new Error("Variant ID is required.");
  }

  const formData = new FormData();
  formData.append("Name", String(variantFormValues?.name || "").trim());
  formData.append("NailShapeId", String(normalizeIntegerId(variantFormValues?.nailShapeId)));
  formData.append("NailSurfaceId", String(normalizeIntegerId(variantFormValues?.nailSurfaceId)));
  formData.append("NailDesignId", String(normalizeIntegerId(variantFormValues?.nailDesignId)));
  formData.append("ImageUrl", String(variantFormValues?.imageUrl || "").trim());
  formData.append("ColorJson", String(variantFormValues?.colorJson || "").trim());

  const response = await axiosClient.put(`/NailVariants/${normalizedVariantId}`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapResponse(response, "Failed to update nail variant.");
}

export async function deleteAdminNailVariant(variantId) {
  const normalizedVariantId = normalizeIntegerId(variantId, -1);

  if (normalizedVariantId <= 0) {
    throw new Error("Variant ID is required.");
  }

  const response = await axiosClient.delete(`/NailVariants/${normalizedVariantId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete nail variant.");
}

export async function fetchAdminNailVariantDetail(variantId) {
  const normalizedVariantId = normalizeIntegerId(variantId, -1);

  if (normalizedVariantId <= 0) {
    throw new Error("Variant ID is required.");
  }

  const response = await axiosClient.get(`/NailVariants/${normalizedVariantId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load nail variant detail.");
  return normalizeAdminNailVariantDetail(data);
}

export async function updateAdminNailDesign(designId, designFormValues) {
  const normalizedDesignId = normalizeIntegerId(designId, -1);

  if (normalizedDesignId <= 0) {
    throw new Error("Design ID is required.");
  }

  const formData = new FormData();
  formData.append("Name", String(designFormValues?.name || "").trim());
  formData.append("Description", String(designFormValues?.description || "").trim());

  const categoryIds = Array.isArray(designFormValues?.categoryIds)
    ? designFormValues.categoryIds
        .map((value) => normalizeIntegerId(value, -1))
        .filter((value) => value > 0)
    : [];
  const nailVariantIds = Array.isArray(designFormValues?.nailVariantIds)
    ? designFormValues.nailVariantIds
        .map((value) => normalizeIntegerId(value, -1))
        .filter((value) => value > 0)
    : [];
  const existingImageUrls = Array.isArray(designFormValues?.existingImageUrls)
    ? designFormValues.existingImageUrls.map((value) => String(value || "").trim()).filter(Boolean)
    : [];

  categoryIds.forEach((value) => {
    formData.append("CategoryIds", String(value));
  });
  nailVariantIds.forEach((value) => {
    formData.append("NailVariantIds", String(value));
  });
  existingImageUrls.forEach((value) => {
    formData.append("ExistingImageUrls", value);
  });

  const response = await axiosClient.put(`/NailDesigns/${normalizedDesignId}`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapResponse(response, "Failed to update nail design.");
}

export async function fetchProceduresByVariant(nailVariantId) {
  const normalizedVariantId = normalizeIntegerId(nailVariantId, -1);

  if (normalizedVariantId <= 0) {
    throw new Error("Variant ID is required.");
  }

  const response = await axiosClient.get(`/Procedures/variant/${normalizedVariantId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load variant procedures.");
  return Array.isArray(data) ? data.map(normalizeVariantProcedure) : [];
}

export async function assignProceduresToVariant(nailVariantId, procedureSteps) {
  const normalizedVariantId = normalizeIntegerId(nailVariantId, -1);

  if (normalizedVariantId <= 0) {
    throw new Error("Variant ID is required.");
  }

  const payload = Array.isArray(procedureSteps)
    ? procedureSteps
        .map((item) => ({
          procedureId: String(item?.procedureId || "").trim(),
          stepOrder: normalizeIntegerId(item?.stepOrder),
        }))
        .filter((item) => item.procedureId && item.stepOrder > 0)
    : [];

  const response = await axiosClient.post(`/Procedures/assign/${normalizedVariantId}`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });

  return unwrapResponse(response, "Failed to assign procedures to variant.");
}
