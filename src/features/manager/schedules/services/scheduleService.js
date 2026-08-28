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

export function getSalonId() {
  const session = loadAuthSession();
  return session?.user?.salonId || session?.salonId || localStorage.getItem("salonId") || null;
}

export async function fetchArtistSchedules(artistId, options = {}) {
  const normalizedId = String(artistId || "").trim();

  if (!normalizedId) {
    throw new Error("Staff Artist ID is required.");
  }

  const { startDate, endDate, fromDate, toDate } = options;

  const response = await axiosClient.get(`/Schedules/artist/${normalizedId}`, {
    headers: getAuthHeaders(),
    params: {
      startDate: startDate || fromDate || undefined,
      endDate: endDate || toDate || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load artist schedules.");
  return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
}

export async function fetchSchedulesBySalonId(salonId, options = {}) {
  const normalizedSalonId = String(salonId || getSalonId()).trim();
  const { startDate, endDate } = options;

  const response = await axiosClient.get(`/Schedules/salon/${normalizedSalonId}`, {
    headers: getAuthHeaders(),
    params: {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load salon staff schedules.");
  return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
}

export async function fetchSchedules({
  pageNumber = 1,
  pageSize = 100,
  startDate,
  endDate,
} = {}) {
  const salonId = getSalonId();
  const response = await axiosClient.get("/Schedules", {
    headers: getAuthHeaders(),
    params: {
      salonId,
      pageNumber,
      pageSize,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load schedules.");
  return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
}

export async function createSchedule(scheduleData) {
  const response = await axiosClient.post("/Schedules", scheduleData, {
    headers: getAuthHeaders(),
  });
  return unwrapResponse(response, "Failed to create schedule.");
}

export async function updateSchedule(scheduleId, scheduleData) {
  const response = await axiosClient.put(`/Schedules/${scheduleId}`, scheduleData, {
    headers: getAuthHeaders(),
  });
  return unwrapResponse(response, "Failed to update schedule.");
}

export async function patchSchedule(scheduleId, scheduleData) {
  const response = await axiosClient.patch(`/Schedules/${scheduleId}`, scheduleData, {
    headers: getAuthHeaders(),
  });
  return unwrapResponse(response, "Failed to update schedule partially.");
}

export async function deleteSchedule(scheduleId) {
  const response = await axiosClient.delete(`/Schedules/${scheduleId}`, {
    headers: getAuthHeaders(),
  });
  return unwrapResponse(response, "Failed to delete schedule.");
}
