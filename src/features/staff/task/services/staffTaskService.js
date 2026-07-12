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

function getStaffArtistId() {
  const session = loadAuthSession();
  const artistId = session?.user?.staffId || session?.staffId || session?.user?.id || session?.userId;

  if (!artistId) {
    throw new Error("Staff artist ID is not available in the current session.");
  }

  return String(artistId).trim();
}

function getStaffSalonId() {
  const session = loadAuthSession();
  const salonId = session?.user?.salonId || session?.salonId;

  if (!salonId) {
    throw new Error("Salon ID is not available in the current session.");
  }

  return String(salonId).trim();
}

function normalizeTask(task) {
  return {
    bookingProcedureId: String(task?.bookingProcedureId || "").trim(),
    bookingItemId: String(task?.bookingItemId || "").trim(),
    procedureId: String(task?.procedureId || "").trim(),
    procedureName: String(task?.procedureName || "").trim() || "Unnamed Procedure",
    description: String(task?.description || "").trim(),
    stepOrder: Number(task?.stepOrder || 0),
    status: String(task?.status || "").trim() || "Pending",
    completedAt: task?.completedAt || null,
    completedById: String(task?.completedById || "").trim(),
    completedByName: String(task?.completedByName || "").trim(),
    isRequired: Boolean(task?.isRequired),
    assignedArtistId: String(task?.assignedArtistId || "").trim(),
    assignedArtistName: String(task?.assignedArtistName || "").trim(),
    estimatedStartTime: String(task?.estimatedStartTime || "").trim(),
    estimatedEndTime: String(task?.estimatedEndTime || "").trim(),
    duration: Number(task?.duration || 0),
    activeDuration: Number(task?.activeDuration || 0),
    passiveDuration: Number(task?.passiveDuration || 0),
    canOverlap: Boolean(task?.canOverlap),
    isMainStep: Boolean(task?.isMainStep),
    bookingId: String(task?.bookingId || "").trim(),
    customerName: String(task?.customerName || "").trim() || "Unknown Customer",
    chairName: String(task?.chairName || "").trim(),
    bookingDate: task?.bookingDate || null,
    startTime: String(task?.startTime || "").trim(),
  };
}

export async function fetchAssignedStaffTasks(artistId = getStaffArtistId()) {
  const normalizedArtistId = String(artistId || "").trim();

  if (!normalizedArtistId) {
    throw new Error("Artist ID is required.");
  }

  const response = await axiosClient.get(`/BookingProcedures/artist/${normalizedArtistId}/tasks`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load assigned tasks.");
  return Array.isArray(data) ? data.map(normalizeTask) : [];
}

export async function fetchClaimableSalonTasks(salonId = getStaffSalonId()) {
  const normalizedSalonId = String(salonId || "").trim();

  const response = await axiosClient.get("/BookingProcedures/claimable", {
    headers: getAuthHeaders(),
    params: {
      salonId: normalizedSalonId || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load claimable salon tasks.");
  return Array.isArray(data) ? data.map(normalizeTask) : [];
}

export async function claimStaffTask(bookingProcedureId) {
  const normalizedBookingProcedureId = String(bookingProcedureId || "").trim();

  if (!normalizedBookingProcedureId) {
    throw new Error("Booking procedure ID is required.");
  }

  const response = await axiosClient.post(
    `/BookingProcedures/procedures/${normalizedBookingProcedureId}/claim`,
    null,
    {
      headers: getAuthHeaders(),
    },
  );

  return normalizeTask(unwrapResponse(response, "Failed to claim task."));
}

export async function updateStaffTaskStatus(
  bookingProcedureId,
  status,
  artistId = getStaffArtistId(),
) {
  const normalizedBookingProcedureId = String(bookingProcedureId || "").trim();
  const normalizedStatus = String(status || "").trim();
  const normalizedArtistId = String(artistId || "").trim();

  if (!normalizedBookingProcedureId) {
    throw new Error("Booking procedure ID is required.");
  }

  if (!normalizedArtistId) {
    throw new Error("Artist ID is required.");
  }

  if (!normalizedStatus) {
    throw new Error("Task status is required.");
  }

  const response = await axiosClient.put(
    `/BookingProcedures/${normalizedBookingProcedureId}/status`,
    null,
    {
      headers: getAuthHeaders(),
      params: {
        artistId: normalizedArtistId,
        status: normalizedStatus,
      },
    },
  );

  return normalizeTask(unwrapResponse(response, "Failed to update task status."));
}
