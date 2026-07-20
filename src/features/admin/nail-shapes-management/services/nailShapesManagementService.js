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

export function formatNailShapeCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} VND`;
}

export function formatNailShapeDuration(value) {
  const duration = Number(value || 0);

  if (!Number.isFinite(duration) || duration <= 0) {
    return "--";
  }

  return `${duration} min`;
}

export function normalizeAdminNailShape(shape) {
  return {
    id: Number(shape?.nailShapeId || 0),
    nailShapeId: Number(shape?.nailShapeId || 0),
    name: String(shape?.name || "").trim() || "--",
    imageUrl: String(shape?.imageUrl || "").trim(),
    price: Number(shape?.price || 0),
    duration: Number(shape?.duration || 0),
    priceLabel: formatNailShapeCurrency(shape?.price || 0),
    durationLabel: formatNailShapeDuration(shape?.duration || 0),
    initials: String(shape?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
}

export async function fetchAdminNailShapes({
  pageNumber = 1,
  pageSize = 10,
  name = "",
} = {}) {
  const response = await axiosClient.get("/NailShapes", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      name: name || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load nail shapes.");
  const items = Array.isArray(data?.items) ? data.items.map(normalizeAdminNailShape) : [];

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageNumber, pageSize }),
  };
}

export async function fetchAdminNailShapeDetail(shapeId) {
  const normalizedShapeId = Number(shapeId || 0);

  if (!Number.isInteger(normalizedShapeId) || normalizedShapeId <= 0) {
    throw new Error("Nail shape ID is required.");
  }

  const response = await axiosClient.get(`/NailShapes/${normalizedShapeId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load nail shape detail.");
  return normalizeAdminNailShape(data);
}

function buildNailShapeFormData(formValues) {
  const formData = new FormData();
  formData.append("Name", String(formValues?.name || "").trim());
  formData.append("Price", String(Number(formValues?.price || 0)));
  formData.append("Duration", String(Number(formValues?.duration || 0)));

  if (formValues?.image instanceof File) {
    formData.append("image", formValues.image);
  }

  return formData;
}

export async function createAdminNailShape(formValues) {
  const response = await axiosClient.post("/NailShapes", buildNailShapeFormData(formValues), {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  const data = unwrapResponse(response, "Failed to create nail shape.");
  return normalizeAdminNailShape(data);
}

export async function updateAdminNailShape(shapeId, formValues) {
  const normalizedShapeId = Number(shapeId || 0);

  if (!Number.isInteger(normalizedShapeId) || normalizedShapeId <= 0) {
    throw new Error("Nail shape ID is required.");
  }

  const response = await axiosClient.put(
    `/NailShapes/${normalizedShapeId}`,
    buildNailShapeFormData(formValues),
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    },
  );

  const data = unwrapResponse(response, "Failed to update nail shape.");
  return normalizeAdminNailShape(data);
}

export async function deleteAdminNailShape(shapeId) {
  const normalizedShapeId = Number(shapeId || 0);

  if (!Number.isInteger(normalizedShapeId) || normalizedShapeId <= 0) {
    throw new Error("Nail shape ID is required.");
  }

  const response = await axiosClient.delete(`/NailShapes/${normalizedShapeId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete nail shape.");
}
