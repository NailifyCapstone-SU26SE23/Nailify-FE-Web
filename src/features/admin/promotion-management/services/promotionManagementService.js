import { axiosClient } from "../../../../lib/axiosClient";
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

function normalizeMetaData(metaData, defaults) {
  return {
    currentPage: Number(metaData?.currentPage || defaults.pageNumber || 1),
    totalPages: Number(metaData?.totalPages || 1),
    pageSize: Number(metaData?.pageSize || defaults.pageSize || 10),
    totalItems: Number(metaData?.totalItems || 0),
    hasPrevious: Boolean(metaData?.hasPrevious),
    hasNext: Boolean(metaData?.hasNext),
    firstRowOnPage: Number(metaData?.firstRowOnPage || 0),
    lastRowOnPage: Number(metaData?.lastRowOnPage || 0),
  };
}

function toNumberOrNull(value) {
  const normalizedValue = Number(value);

  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return null;
  }

  return normalizedValue;
}

function normalizeString(value, fallback = "") {
  return String(value || "").trim() || fallback;
}

function normalizeDateTime(value) {
  return String(value || "").trim();
}

function normalizePromotionList(data) {
  if (Array.isArray(data)) {
    return data.map(normalizePromotion);
  }

  if (Array.isArray(data?.items)) {
    return data.items.map(normalizePromotion);
  }

  return [];
}

export const PROMOTION_TYPE_OPTIONS = [
  "Automatic",
  "Voucher",
  "Seasonal",
  "FlashSale",
];

export const PROMOTION_SCOPE_OPTIONS = [
  "All",
  "Category",
  "CategoryType",
  "NailDesign",
];

export const PROMOTION_DISCOUNT_TYPE_OPTIONS = [
  "Percentage",
  "FixedAmount",
];

export function normalizePromotion(promotion) {
  return {
    id: Number(promotion?.promotionId || promotion?.id || 0),
    promotionId: Number(promotion?.promotionId || promotion?.id || 0),
    name: normalizeString(promotion?.name, "--"),
    description: normalizeString(promotion?.description),
    type: normalizeString(promotion?.type, "--"),
    scope: normalizeString(promotion?.scope, "--"),
    discountType: normalizeString(promotion?.discountType, "--"),
    discountValue: Number(promotion?.discountValue || 0),
    categoryId: toNumberOrNull(promotion?.categoryId),
    categoryTypeId: toNumberOrNull(promotion?.categoryTypeId),
    nailDesignId: toNumberOrNull(promotion?.nailDesignId),
    startDate: normalizeDateTime(promotion?.startDate),
    endDate: normalizeDateTime(promotion?.endDate),
    usageLimit: toNumberOrNull(promotion?.usageLimit),
    userLimit: toNumberOrNull(promotion?.userLimit),
    imageUrl: normalizeString(promotion?.imageUrl || promotion?.image),
    status: normalizeString(promotion?.status, "--"),
    isActive: Boolean(
      promotion?.isActive ??
      (normalizeString(promotion?.status).toLowerCase() === "active"),
    ),
  };
}

function appendIfPresent(formData, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  formData.append(key, String(value));
}

function buildPromotionFormData(formValues) {
  const formData = new FormData();

  appendIfPresent(formData, "Name", normalizeString(formValues?.name));
  appendIfPresent(formData, "Description", normalizeString(formValues?.description));
  appendIfPresent(formData, "Type", normalizeString(formValues?.type));
  appendIfPresent(formData, "Scope", normalizeString(formValues?.scope));
  appendIfPresent(formData, "DiscountType", normalizeString(formValues?.discountType));
  appendIfPresent(formData, "DiscountValue", formValues?.discountValue);
  appendIfPresent(formData, "CategoryId", toNumberOrNull(formValues?.categoryId));
  appendIfPresent(formData, "CategoryTypeId", toNumberOrNull(formValues?.categoryTypeId));
  appendIfPresent(formData, "NailDesignId", toNumberOrNull(formValues?.nailDesignId));
  appendIfPresent(formData, "StartDate", normalizeDateTime(formValues?.startDate));
  appendIfPresent(formData, "EndDate", normalizeDateTime(formValues?.endDate));
  appendIfPresent(formData, "UsageLimit", formValues?.usageLimit);
  appendIfPresent(formData, "UserLimit", formValues?.userLimit);

  if (formValues?.imageFile) {
    formData.append("image", formValues.imageFile);
  }

  return formData;
}

export async function fetchAdminPromotions({
  pageNumber = 1,
  pageSize = 10,
  type = "",
  scope = "",
  discountType = "",
  startDate = "",
  endDate = "",
} = {}) {
  const response = await axiosClient.get("/Promotions", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      type: type || undefined,
      scope: scope || undefined,
      discountType: discountType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load promotions.");
  const items = Array.isArray(data?.items) ? data.items.map(normalizePromotion) : [];

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageNumber, pageSize }),
  };
}

export async function fetchAdminPromotionDetail(promotionId) {
  const normalizedPromotionId = Number(promotionId || 0);

  if (!Number.isInteger(normalizedPromotionId) || normalizedPromotionId <= 0) {
    throw new Error("Promotion ID is required.");
  }

  const response = await axiosClient.get(`/Promotions/${normalizedPromotionId}`, {
    headers: getAuthHeaders(),
  });

  return normalizePromotion(unwrapResponse(response, "Failed to load promotion detail."));
}

export async function createAdminPromotion(formValues) {
  const response = await axiosClient.post("/Promotions", buildPromotionFormData(formValues), {
    headers: getAuthHeaders(),
  });

  return normalizePromotion(unwrapResponse(response, "Failed to create promotion."));
}

export async function updateAdminPromotion(promotionId, formValues) {
  const normalizedPromotionId = Number(promotionId || 0);

  if (!Number.isInteger(normalizedPromotionId) || normalizedPromotionId <= 0) {
    throw new Error("Promotion ID is required.");
  }

  const response = await axiosClient.put(`/Promotions/${normalizedPromotionId}`, buildPromotionFormData(formValues), {
    headers: getAuthHeaders(),
  });

  return normalizePromotion(unwrapResponse(response, "Failed to update promotion."));
}

export async function deleteAdminPromotion(promotionId) {
  const normalizedPromotionId = Number(promotionId || 0);

  if (!Number.isInteger(normalizedPromotionId) || normalizedPromotionId <= 0) {
    throw new Error("Promotion ID is required.");
  }

  const response = await axiosClient.delete(`/Promotions/${normalizedPromotionId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete promotion.");
}

export async function fetchPromotionCategoryOptions() {
  let pageNumber = 1;
  let hasNext = true;
  const options = [];

  while (hasNext) {
    const response = await axiosClient.get("/Categories", {
      headers: getAuthHeaders(),
      params: {
        pageNumber,
        pageSize: 100,
      },
    });

    const data = unwrapResponse(response, "Failed to load category options.");
    const items = Array.isArray(data?.items) ? data.items : [];
    const metaData = data?.metaData ?? {};

    options.push(
      ...items.map((item) => ({
        value: Number(item?.categoryId || 0),
        label: normalizeString(item?.name, "--"),
        status: normalizeString(item?.status, "--"),
      })),
    );

    hasNext = Boolean(metaData?.hasNext);
    pageNumber += 1;
  }

  return options.filter((item) => item.value > 0);
}

export async function fetchPromotionCategoryTypeOptions() {
  let pageNumber = 1;
  let hasNext = true;
  const options = [];

  while (hasNext) {
    const response = await axiosClient.get("/CategoryTypes", {
      headers: getAuthHeaders(),
      params: {
        pageNumber,
        pageSize: 100,
      },
    });

    const data = unwrapResponse(response, "Failed to load category type options.");
    const items = Array.isArray(data?.items) ? data.items : [];
    const metaData = data?.metaData ?? {};

    options.push(
      ...items.map((item) => ({
        value: Number(item?.categoryTypeId || 0),
        label: normalizeString(item?.name, "--"),
        status: normalizeString(item?.status, "--"),
      })),
    );

    hasNext = Boolean(metaData?.hasNext);
    pageNumber += 1;
  }

  return options.filter((item) => item.value > 0);
}

export async function fetchPromotionNailDesignOptions() {
  let pageNumber = 1;
  let hasNext = true;
  const options = [];

  while (hasNext) {
    const response = await axiosClient.get("/NailDesigns", {
      headers: getAuthHeaders(),
      params: {
        pageNumber,
        pageSize: 100,
      },
    });

    const data = unwrapResponse(response, "Failed to load nail design options.");
    const items = Array.isArray(data?.items) ? data.items : [];
    const metaData = data?.metaData ?? {};

    options.push(
      ...items.map((item) => ({
        value: Number(item?.nailDesignId || 0),
        label: normalizeString(item?.name, "--"),
        status: normalizeString(item?.status, "--"),
      })),
    );

    hasNext = Boolean(metaData?.hasNext);
    pageNumber += 1;
  }

  return options.filter((item) => item.value > 0);
}

export async function fetchPromotionsByCategory(categoryId) {
  const normalizedCategoryId = Number(categoryId || 0);

  if (!Number.isInteger(normalizedCategoryId) || normalizedCategoryId <= 0) {
    return [];
  }

  const response = await axiosClient.get(`/Promotions/by-category/${normalizedCategoryId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load promotions by category.");
  return normalizePromotionList(data);
}

export async function fetchPromotionsByCategoryType(categoryTypeId) {
  const normalizedCategoryTypeId = Number(categoryTypeId || 0);

  if (!Number.isInteger(normalizedCategoryTypeId) || normalizedCategoryTypeId <= 0) {
    return [];
  }

  const response = await axiosClient.get(`/Promotions/by-category-type/${normalizedCategoryTypeId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load promotions by category type.");
  return normalizePromotionList(data);
}

export async function fetchPromotionsByNailDesign(nailDesignId) {
  const normalizedNailDesignId = Number(nailDesignId || 0);

  if (!Number.isInteger(normalizedNailDesignId) || normalizedNailDesignId <= 0) {
    return [];
  }

  const response = await axiosClient.get(`/Promotions/by-nail-design/${normalizedNailDesignId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load promotions by nail design.");
  return normalizePromotionList(data);
}
