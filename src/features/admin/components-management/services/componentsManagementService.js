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

export const COMPONENT_TYPE_OPTIONS = ["Gem", "Sticker", "Charm", "Art"];

export function formatComponentCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} VND`;
}

export function formatComponentDuration(value) {
  const duration = Number(value || 0);

  if (!Number.isFinite(duration) || duration <= 0) {
    return "--";
  }

  return `${duration} min`;
}

export function normalizeAdminComponent(component) {
  return {
    id: Number(component?.componentId || 0),
    componentId: Number(component?.componentId || 0),
    name: String(component?.name || "").trim(),
    imageUrl: String(component?.imageUrl || "").trim(),
    componentType: String(component?.componentType || "").trim(),
    price: Number(component?.price || 0),
    duration: Number(component?.duration || 0),
    priceLabel: formatComponentCurrency(component?.price || 0),
    durationLabel: formatComponentDuration(component?.duration || 0),
    initials: String(component?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
}

export async function fetchAdminComponents({
  pageNumber = 1,
  pageSize = 10,
  name = "",
  componentType = "",
} = {}) {
  const response = await axiosClient.get("/Components", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      name: name || undefined,
      componentType: componentType || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load components.");
  const items = Array.isArray(data?.items) ? data.items.map(normalizeAdminComponent) : [];

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageNumber, pageSize }),
  };
}

export async function fetchAdminComponentDetail(componentId) {
  const normalizedComponentId = Number(componentId || 0);

  if (!Number.isInteger(normalizedComponentId) || normalizedComponentId <= 0) {
    throw new Error("Component ID is required.");
  }

  const response = await axiosClient.get(`/Components/${normalizedComponentId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load component detail.");
  return normalizeAdminComponent(data);
}

function buildComponentFormData(formValues) {
  const formData = new FormData();
  formData.append("Name", String(formValues?.name || "").trim());
  formData.append("ComponentType", String(formValues?.componentType || "").trim());
  formData.append("Price", String(Number(formValues?.price || 0)));
  formData.append("Duration", String(Number(formValues?.duration || 0)));

  if (formValues?.image instanceof File) {
    formData.append("image", formValues.image);
  }

  return formData;
}

export async function createAdminComponent(formValues) {
  const response = await axiosClient.post("/Components", buildComponentFormData(formValues), {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  const data = unwrapResponse(response, "Failed to create component.");
  return normalizeAdminComponent(data);
}

export async function updateAdminComponent(componentId, formValues) {
  const normalizedComponentId = Number(componentId || 0);

  if (!Number.isInteger(normalizedComponentId) || normalizedComponentId <= 0) {
    throw new Error("Component ID is required.");
  }

  const response = await axiosClient.put(
    `/Components/${normalizedComponentId}`,
    buildComponentFormData(formValues),
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    },
  );

  const data = unwrapResponse(response, "Failed to update component.");
  return normalizeAdminComponent(data);
}

export async function deleteAdminComponent(componentId) {
  const normalizedComponentId = Number(componentId || 0);

  if (!Number.isInteger(normalizedComponentId) || normalizedComponentId <= 0) {
    throw new Error("Component ID is required.");
  }

  const response = await axiosClient.delete(`/Components/${normalizedComponentId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete component.");
}
