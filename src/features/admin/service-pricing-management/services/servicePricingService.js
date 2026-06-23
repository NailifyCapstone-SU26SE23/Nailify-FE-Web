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

function inferServiceCategory(service) {
  const content = [service?.name, service?.description].join(" ").toLowerCase();

  if (content.includes("spa") || content.includes("massage")) {
    return "Hand Spa";
  }

  if (content.includes("gel")) {
    return "Gel Nail";
  }

  if (content.includes("design") || content.includes("art") || content.includes("stone")) {
    return "Nail Art";
  }

  if (content.includes("extension") || content.includes("acrylic")) {
    return "Gel Extension";
  }

  if (content.includes("remove") || content.includes("removal")) {
    return "Removal";
  }

  return "Basic Nail";
}

export function normalizeAdminService(service) {
  return {
    id: service?.serviceId || "",
    serviceId: service?.serviceId || "",
    name: String(service?.name || "").trim() || "--",
    description: String(service?.description || "").trim(),
    category: inferServiceCategory(service),
    price: Number(service?.price || 0),
    duration: Number(service?.duration || 0),
    hasAddOn: false,
    status: String(service?.status || "").trim() || "Inactive",
    createdAt: service?.createAt || "",
  };
}

export async function fetchAdminServices({ pageNumber = 1, pageSize = 10, name = "" } = {}) {
  const response = await axiosClient.get("/Services", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      name: name || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load services.");
  const items = Array.isArray(data?.items) ? data.items.map(normalizeAdminService) : [];
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
