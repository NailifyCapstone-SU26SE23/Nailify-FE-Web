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
    currentPage: Number(metaData?.currentPage || defaults.pageIndex || 1),
    totalPages: Number(metaData?.totalPages || 1),
    pageSize: Number(metaData?.pageSize || defaults.pageSize || 10),
    totalItems: Number(metaData?.totalItems || 0),
    hasPrevious: Boolean(metaData?.hasPrevious),
    hasNext: Boolean(metaData?.hasNext),
    firstRowOnPage: Number(metaData?.firstRowOnPage || 0),
    lastRowOnPage: Number(metaData?.lastRowOnPage || 0),
  };
}

export const PROCEDURE_STATUS_OPTIONS = ["Active", "Inactive"];
export const PROCEDURE_SORT_OPTIONS = [
  { value: "", label: "Newest first" },
  { value: "name", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "duration", label: "Duration low-high" },
  { value: "duration_desc", label: "Duration high-low" },
  { value: "createAt", label: "Created oldest-newest" },
  { value: "createAt_desc", label: "Created newest-oldest" },
];

export function formatProcedureDuration(value) {
  const duration = Number(value || 0);

  if (!Number.isFinite(duration) || duration < 0) {
    return "--";
  }

  return `${duration} min`;
}

export function formatProcedureDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function normalizeAdminProcedure(procedure) {
  return {
    id: String(procedure?.procedureId || "").trim(),
    procedureId: String(procedure?.procedureId || "").trim(),
    name: String(procedure?.name || "").trim(),
    description: String(procedure?.description || "").trim(),
    duration: Number(procedure?.duration || 0),
    status: String(procedure?.status || "").trim(),
    createAt: String(procedure?.createAt || "").trim(),
    isRequired: Boolean(procedure?.isRequired),
    durationLabel: formatProcedureDuration(procedure?.duration || 0),
    createAtLabel: formatProcedureDate(procedure?.createAt || ""),
    initials: String(procedure?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
}

export async function fetchAdminProcedures({
  pageIndex = 1,
  pageSize = 10,
  orderBy = "",
} = {}) {
  const response = await axiosClient.get("/Procedures", {
    headers: getAuthHeaders(),
    params: {
      PageIndex: pageIndex,
      PageSize: pageSize,
      OrderBy: orderBy || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load procedures.");
  const items = Array.isArray(data?.items) ? data.items.map(normalizeAdminProcedure) : [];

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageIndex, pageSize }),
  };
}

export async function fetchAdminProcedureDetail(procedureId) {
  const normalizedProcedureId = String(procedureId || "").trim();

  if (!normalizedProcedureId) {
    throw new Error("Procedure ID is required.");
  }

  const response = await axiosClient.get(`/Procedures/${normalizedProcedureId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load procedure detail.");
  return normalizeAdminProcedure(data);
}

function buildProcedurePayload(formValues, includeStatus = false) {
  const payload = {
    name: String(formValues?.name || "").trim(),
    description: String(formValues?.description || "").trim(),
    duration: Number(formValues?.duration || 0),
    isRequired: Boolean(formValues?.isRequired),
  };

  if (includeStatus) {
    payload.status = String(formValues?.status || "").trim();
  }

  return payload;
}

export async function createAdminProcedure(formValues) {
  const response = await axiosClient.post("/Procedures", buildProcedurePayload(formValues), {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to create procedure.");
  return normalizeAdminProcedure(data);
}

export async function updateAdminProcedure(procedureId, formValues) {
  const normalizedProcedureId = String(procedureId || "").trim();

  if (!normalizedProcedureId) {
    throw new Error("Procedure ID is required.");
  }

  const response = await axiosClient.put(
    `/Procedures/${normalizedProcedureId}`,
    buildProcedurePayload(formValues, true),
    {
      headers: getAuthHeaders(),
    },
  );

  const data = unwrapResponse(response, "Failed to update procedure.");
  return normalizeAdminProcedure(data);
}

export async function deleteAdminProcedure(procedureId) {
  const normalizedProcedureId = String(procedureId || "").trim();

  if (!normalizedProcedureId) {
    throw new Error("Procedure ID is required.");
  }

  const response = await axiosClient.delete(`/Procedures/${normalizedProcedureId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete procedure.");
}
