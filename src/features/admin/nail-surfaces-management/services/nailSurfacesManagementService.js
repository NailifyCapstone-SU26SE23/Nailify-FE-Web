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
    name: String(surface?.name || "").trim(),
    shaderParam: String(surface?.shaderParam || "").trim(),
    lightnessOffset: Number(surface?.lightnessOffset || 0),
    saturationOffset: Number(surface?.saturationOffset || 0),
    hueOffset: Number(surface?.hueOffset || 0),
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
  try {
    const response = await axiosClient.get("/NailSurfaces", {
      params: {
        pageNumber,
        pageSize,
        ...(name && { name }),
      },
      headers: getAuthHeaders(),
    });

    const data = unwrapResponse(response, "Failed to fetch nail surfaces.");

    return {
      items: (data?.items || []).map(normalizeAdminNailSurface),
      metaData: normalizeMetaData(data?.metaData, {
        pageNumber,
        pageSize,
      }),
    };
  } catch (error) {
    console.error("fetchAdminNailSurfaces error:", error);
    throw error;
  }
}

export async function fetchAdminNailSurfaceDetail(surfaceId) {
  try {
    const response = await axiosClient.get(`/NailSurfaces/${surfaceId}`, {
      headers: getAuthHeaders(),
    });

    const data = unwrapResponse(response, "Failed to fetch nail surface details.");
    return normalizeAdminNailSurface(data);
  } catch (error) {
    console.error("fetchAdminNailSurfaceDetail error:", error);
    throw error;
  }
}

export async function createAdminNailSurface(payload) {
  try {
    const response = await axiosClient.post("/NailSurfaces", payload, {
      headers: getAuthHeaders(),
    });

    const data = unwrapResponse(response, "Failed to create nail surface.");
    return normalizeAdminNailSurface(data);
  } catch (error) {
    console.error("createAdminNailSurface error:", error);
    throw error;
  }
}

export async function updateAdminNailSurface(surfaceId, payload) {
  const normalizedSurfaceId = Number(surfaceId || 0);

  if (!Number.isInteger(normalizedSurfaceId) || normalizedSurfaceId <= 0) {
    throw new Error("Nail surface ID is required.");
  }

  try {
    const response = await axiosClient.put(`/NailSurfaces/${normalizedSurfaceId}`, payload, {
      headers: getAuthHeaders(),
    });

    const data = unwrapResponse(response, "Failed to update nail surface.");
    return normalizeAdminNailSurface(data);
  } catch (error) {
    console.error("updateAdminNailSurface error:", error);
    throw error;
  }
}

export async function deleteAdminNailSurface(surfaceId) {
  const normalizedSurfaceId = Number(surfaceId || 0);

  if (!Number.isInteger(normalizedSurfaceId) || normalizedSurfaceId <= 0) {
    throw new Error("Nail surface ID is required.");
  }

  try {
    const response = await axiosClient.delete(`/NailSurfaces/${normalizedSurfaceId}`, {
      headers: getAuthHeaders(),
    });

    const data = unwrapResponse(response, "Failed to delete nail surface.");
    return { isSucceeded: true, data };
  } catch (error) {
    console.error("deleteAdminNailSurface error:", error);
    throw error;
  }
}
