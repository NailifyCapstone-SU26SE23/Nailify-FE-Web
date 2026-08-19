import { axiosClient } from "../../../../lib/axiosClient";
import { loadAuthSession } from "../../auth/model/authStorage";

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

export function getStaffArtistId() {
  const session = loadAuthSession();
  const artistId = session?.user?.staffId || session?.staffId || session?.user?.id || session?.userId;

  if (!artistId) {
    throw new Error("Staff ID is not available in the current session.");
  }

  return String(artistId).trim();
}

export function getSalonId() {
  const session = loadAuthSession();
  const salonId = session?.user?.salonId || session?.salonId;

  return salonId || null;
}

export async function fetchBreaks({ pageNumber = 1, pageSize = 10, artistId, date } = {}) {
  const params = {
    pageNumber,
    pageSize,
  };

  if (artistId) {
    params.artistId = artistId;
  }

  if (date) {
    params.date = date;
  }

  const response = await axiosClient.get("/NailArtistBreaks", {
    headers: getAuthHeaders(),
    params,
  });

  return unwrapResponse(response, "Failed to load break list.");
}

export async function createBreakRequest({ nailArtistId, breakDate, startTime, endTime, reason }) {
  const payload = {
    nailArtistId,
    breakDate,
    startTime,
    endTime,
    reason,
  };

  const response = await axiosClient.post("/NailArtistBreaks", payload, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to create break request.");
}

export async function updateBreakRequest(id, { startTime, endTime, reason }) {
  const payload = {
    startTime,
    endTime,
    reason,
  };

  const response = await axiosClient.put(`/NailArtistBreaks/${id}`, payload, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to update break request.");
}

export async function deleteBreakRequest(id) {
  const response = await axiosClient.delete(`/NailArtistBreaks/${id}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete break request.");
}

export async function approveRejectBreakRequest(id, { status, rejectReason }) {
  const params = {
    status, // "Approved" (or 1) / "Rejected" (or 2)
  };

  if (rejectReason) {
    params.rejectReason = rejectReason;
  }

  const response = await axiosClient.post(`/NailArtistBreaks/${id}/approve-reject`, null, {
    headers: getAuthHeaders(),
    params,
  });

  return unwrapResponse(response, "Failed to update break request status.");
}

export async function fetchNailArtists() {
  try {
    const id = getSalonId();
    const response = await axiosClient.get(`/Users/salon/${id}/staff`, {
      headers: getAuthHeaders(),
      params: { role: "Staff_Artist" },
    });

    const data = unwrapResponse(response, "Failed to load Staff Artists.");
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

    return items.map((staff) => ({
      id: staff?.staffId || staff?.userId || staff?.id || "",
      name: staff?.fullName ||
        (staff?.firstName && staff?.lastName ? `${staff.firstName} ${staff.lastName}`.trim() : "Unnamed Artist"),
    }));
  } catch (error) {
    console.warn("Failed to load Staff Artists. Using empty fallback list.", error);
    return [];
  }
}
