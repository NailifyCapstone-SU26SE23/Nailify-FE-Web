import { axiosClient } from "../../../../lib/axiosClient";
import { loadAuthSession } from "../../../core/auth/model/authStorage";

function getAuthHeaders() {
  const session = loadAuthSession();
  const token = session?.accessToken || session?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function unwrapResponse(response, fallbackMessage) {
  const payload = response?.data;
  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }
  return payload.data;
}

export async function fetchTodayQueue(salonId) {
  if (!salonId) throw new Error("Salon ID is required.");
  try {
    const response = await axiosClient.get(`/WalkInQueues/salon/${salonId}/today`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load today's walk-in queue.");
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || "Failed to load today's walk-in queue.";
    throw new Error(errorMsg, { cause: error });
  }
}

export async function addToQueue(payload) {
  try {
    const response = await axiosClient.post(`/WalkInQueues`, payload, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to add customer to queue.");
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || "Failed to add customer to queue.";
    throw new Error(errorMsg, { cause: error });
  }
}

export async function callQueueEntry(id) {
  if (!id) throw new Error("Queue Entry ID is required.");
  try {
    const response = await axiosClient.post(`/WalkInQueues/${id}/call`, null, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to call customer.");
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || "Failed to call customer.";
    throw new Error(errorMsg, { cause: error });
  }
}

export async function assignArtistToQueue(id, nailArtistId) {
  if (!id) throw new Error("Queue Entry ID is required.");
  if (!nailArtistId) throw new Error("Artist ID is required.");
  try {
    const response = await axiosClient.post(`/WalkInQueues/${id}/assign-artist`, { nailArtistId }, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to assign artist.");
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || "Failed to assign artist.";
    throw new Error(errorMsg, { cause: error });
  }
}

export async function completeQueueEntry(id) {
  if (!id) throw new Error("Queue Entry ID is required.");
  try {
    const response = await axiosClient.post(`/WalkInQueues/${id}/complete`, null, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to complete queue entry.");
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || "Failed to complete queue entry.";
    throw new Error(errorMsg, { cause: error });
  }
}

export async function markQueueEntryLeft(id) {
  if (!id) throw new Error("Queue Entry ID is required.");
  try {
    const response = await axiosClient.post(`/WalkInQueues/${id}/mark-left`, null, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to mark customer as left.");
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || "Failed to mark customer as left.";
    throw new Error(errorMsg, { cause: error });
  }
}

export async function prioritizeQueueEntry(id) {
  if (!id) throw new Error("Queue Entry ID is required.");
  try {
    const response = await axiosClient.post(`/WalkInQueues/${id}/prioritize`, null, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to prioritize queue entry.");
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || "Failed to prioritize queue entry.";
    throw new Error(errorMsg, { cause: error });
  }
}
