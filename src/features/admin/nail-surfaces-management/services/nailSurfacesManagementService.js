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

export function formatNailSurfaceCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} VND`;
}

export function formatNailSurfaceDuration(value) {
  const duration = Number(value || 0);

  if (!Number.isFinite(duration) || duration <= 0) {
    return "--";
  }

  return `${duration} min`;
}

export function normalizeAdminNailSurface(surface) {
  return {
    id: Number(surface?.nailSurfaceId || 0),
    nailSurfaceId: Number(surface?.nailSurfaceId || 0),
    name: String(surface?.name || "").trim() || "--",
    shaderParam: String(surface?.shaderParam || "").trim() || "--",
    price: Number(surface?.price || 0),
    duration: Number(surface?.duration || 0),
    priceLabel: formatNailSurfaceCurrency(surface?.price || 0),
    durationLabel: formatNailSurfaceDuration(surface?.duration || 0),
    initials: String(surface?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
}

export async function fetchAdminNailSurfaces({
  pageNumber = 1,
  pageSize = 10,
  name = "",
} = {}) {
  const response = await axiosClient.get("/NailSurfaces", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      name: name || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load nail surfaces.");
  const items = Array.isArray(data?.items) ? data.items.map(normalizeAdminNailSurface) : [];

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageNumber, pageSize }),
  };
}

export async function fetchAdminNailSurfaceDetail(surfaceId) {
  const normalizedSurfaceId = Number(surfaceId || 0);

  if (!Number.isInteger(normalizedSurfaceId) || normalizedSurfaceId <= 0) {
    throw new Error("Nail surface ID is required.");
  }

  const response = await axiosClient.get(`/NailSurfaces/${normalizedSurfaceId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load nail surface detail.");
  return normalizeAdminNailSurface(data);
}

function buildNailSurfacePayload(formValues) {
  return {
    name: String(formValues?.name || "").trim(),
    shaderParam: String(formValues?.shaderParam || "").trim(),
    price: Number(formValues?.price || 0),
    duration: Number(formValues?.duration || 0),
  };
}

export async function createAdminNailSurface(formValues) {
  const response = await axiosClient.post("/NailSurfaces", buildNailSurfacePayload(formValues), {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to create nail surface.");
  return normalizeAdminNailSurface(data);
}

export async function updateAdminNailSurface(surfaceId, formValues) {
  const normalizedSurfaceId = Number(surfaceId || 0);

  if (!Number.isInteger(normalizedSurfaceId) || normalizedSurfaceId <= 0) {
    throw new Error("Nail surface ID is required.");
  }

  const response = await axiosClient.put(
    `/NailSurfaces/${normalizedSurfaceId}`,
    buildNailSurfacePayload(formValues),
    {
      headers: getAuthHeaders(),
    },
  );

  const data = unwrapResponse(response, "Failed to update nail surface.");
  return normalizeAdminNailSurface(data);
}

export async function deleteAdminNailSurface(surfaceId) {
  const normalizedSurfaceId = Number(surfaceId || 0);

  if (!Number.isInteger(normalizedSurfaceId) || normalizedSurfaceId <= 0) {
    throw new Error("Nail surface ID is required.");
  }

  const response = await axiosClient.delete(`/NailSurfaces/${normalizedSurfaceId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete nail surface.");
}
