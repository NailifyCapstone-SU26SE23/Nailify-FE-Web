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

export const CATEGORY_TYPE_STATUS_OPTIONS = ["Active", "InActive", "Inactive"];

function normalizeCategory(category) {
  return {
    categoryId: Number(category?.categoryId || 0),
    name: String(category?.name || "").trim(),
    categoryTypeId: Number(category?.categoryTypeId || 0),
    categoryTypeName: String(category?.categoryTypeName || "").trim(),
    status: String(category?.status || "").trim(),
  };
}

export function normalizeAdminCategoryType(categoryType) {
  const categories = Array.isArray(categoryType?.categories)
    ? categoryType.categories.map(normalizeCategory)
    : [];

  return {
    id: Number(categoryType?.categoryTypeId || 0),
    categoryTypeId: Number(categoryType?.categoryTypeId || 0),
    name: String(categoryType?.name || "").trim(),
    status: String(categoryType?.status || "").trim(),
    categories,
    categoriesCount: categories.length,
    categoriesLabel: categories.length
      ? categories
        .slice(0, 3)
        .map((item) => item.name)
        .join(", ")
      : "No categories",
    initials: String(categoryType?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
}

export async function fetchAdminCategoryTypes({
  pageNumber = 1,
  pageSize = 10,
  name = "",
} = {}) {
  const response = await axiosClient.get("/CategoryTypes", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      name: name || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load category types.");
  const items = Array.isArray(data?.items) ? data.items.map(normalizeAdminCategoryType) : [];

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageNumber, pageSize }),
  };
}

export async function fetchAdminCategoryTypeDetail(categoryTypeId) {
  const normalizedCategoryTypeId = Number(categoryTypeId || 0);

  if (!Number.isInteger(normalizedCategoryTypeId) || normalizedCategoryTypeId <= 0) {
    throw new Error("Category type ID is required.");
  }

  const response = await axiosClient.get(`/CategoryTypes/${normalizedCategoryTypeId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load category type detail.");
  return normalizeAdminCategoryType(data);
}

export async function createAdminCategoryType(formValues) {
  const response = await axiosClient.post(
    "/CategoryTypes",
    {
      name: String(formValues?.name || "").trim(),
    },
    {
      headers: getAuthHeaders(),
    },
  );

  const data = unwrapResponse(response, "Failed to create category type.");
  return normalizeAdminCategoryType(data);
}

export async function updateAdminCategoryType(categoryTypeId, formValues) {
  const normalizedCategoryTypeId = Number(categoryTypeId || 0);

  if (!Number.isInteger(normalizedCategoryTypeId) || normalizedCategoryTypeId <= 0) {
    throw new Error("Category type ID is required.");
  }

  const response = await axiosClient.put(
    `/CategoryTypes/${normalizedCategoryTypeId}`,
    {
      name: String(formValues?.name || "").trim(),
      status: String(formValues?.status || "").trim(),
    },
    {
      headers: getAuthHeaders(),
    },
  );

  const data = unwrapResponse(response, "Failed to update category type.");
  return normalizeAdminCategoryType(data);
}

export async function deleteAdminCategoryType(categoryTypeId) {
  const normalizedCategoryTypeId = Number(categoryTypeId || 0);

  if (!Number.isInteger(normalizedCategoryTypeId) || normalizedCategoryTypeId <= 0) {
    throw new Error("Category type ID is required.");
  }

  const response = await axiosClient.delete(`/CategoryTypes/${normalizedCategoryTypeId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete category type.");
}
