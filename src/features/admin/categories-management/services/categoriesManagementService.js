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

export const CATEGORY_STATUS_OPTIONS = ["Active", "InActive", "Inactive"];

export function normalizeAdminCategory(category) {
  return {
    id: Number(category?.categoryId || 0),
    categoryId: Number(category?.categoryId || 0),
    name: String(category?.name || "").trim() || "--",
    categoryTypeId: Number(category?.categoryTypeId || 0),
    categoryTypeName: String(category?.categoryTypeName || "").trim() || "--",
    status: String(category?.status || "").trim() || "--",
    initials: String(category?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
}

export function normalizeAdminCategoryTypeOption(categoryType) {
  return {
    value: Number(categoryType?.categoryTypeId || 0),
    label: String(categoryType?.name || "").trim() || "--",
    status: String(categoryType?.status || "").trim() || "--",
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

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageNumber, pageSize }),
  };
}

export async function fetchAdminCategoryDetail(categoryId) {
  const normalizedCategoryId = Number(categoryId || 0);

  if (!Number.isInteger(normalizedCategoryId) || normalizedCategoryId <= 0) {
    throw new Error("Category ID is required.");
  }

  const response = await axiosClient.get(`/Categories/${normalizedCategoryId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load category detail.");
  return normalizeAdminCategory(data);
}

export async function createAdminCategory(formValues) {
  const response = await axiosClient.post(
    "/Categories",
    {
      name: String(formValues?.name || "").trim(),
      categoryTypeId: Number(formValues?.categoryTypeId || 0),
    },
    {
      headers: getAuthHeaders(),
    },
  );

  const data = unwrapResponse(response, "Failed to create category.");
  return normalizeAdminCategory(data);
}

export async function updateAdminCategory(categoryId, formValues) {
  const normalizedCategoryId = Number(categoryId || 0);

  if (!Number.isInteger(normalizedCategoryId) || normalizedCategoryId <= 0) {
    throw new Error("Category ID is required.");
  }

  const response = await axiosClient.put(
    `/Categories/${normalizedCategoryId}`,
    {
      name: String(formValues?.name || "").trim(),
      categoryTypeId: Number(formValues?.categoryTypeId || 0),
      status: String(formValues?.status || "").trim(),
    },
    {
      headers: getAuthHeaders(),
    },
  );

  const data = unwrapResponse(response, "Failed to update category.");
  return normalizeAdminCategory(data);
}

export async function deleteAdminCategory(categoryId) {
  const normalizedCategoryId = Number(categoryId || 0);

  if (!Number.isInteger(normalizedCategoryId) || normalizedCategoryId <= 0) {
    throw new Error("Category ID is required.");
  }

  const response = await axiosClient.delete(`/Categories/${normalizedCategoryId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete category.");
}

export async function fetchAdminCategoryTypeOptions() {
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

    options.push(...items.map(normalizeAdminCategoryTypeOption));
    hasNext = Boolean(metaData.hasNext);
    pageNumber += 1;
  }

  return options.filter((item) => item.value > 0);
}
