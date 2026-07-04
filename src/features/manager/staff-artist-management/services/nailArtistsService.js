
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

function getSalonId() {
  const session = loadAuthSession();
  const salonId = session?.user?.salonId || session?.salonId;

  if (!salonId) {
    throw new Error("Salon ID is not available in the current account profile.");
  }

  return salonId;
}

function unwrapResponse(response, fallbackMessage) {
  const payload = response?.data;

  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }

  // Handle both formats: data.items (for lists) or just data (for single items)
  if (payload.data && payload.data.items) {
    return payload.data.items;
  }
  return payload.data;
}

export async function fetchNailArtists(salonId) {
  try {
    // Try with salonId first
    const id = salonId || getSalonId();
    console.log("Fetching nail artists with salonId:", id);
    
    const response = await axiosClient.get(`/NailArtists`, {
      headers: getAuthHeaders(),
      params: { salonId: id },
    });

    return unwrapResponse(response, "Failed to load nail artists.");
  } catch (error) {
    console.warn("Failed with salonId, trying without...", error);
    // Fallback: try without salonId
    const response = await axiosClient.get(`/NailArtists`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load nail artists.");
  }
}

export async function fetchNailArtistById(artistId) {
  const normalizedId = String(artistId || "").trim();

  if (!normalizedId) {
    throw new Error("Nail artist ID is required.");
  }

  const response = await axiosClient.get(`/NailArtists/${normalizedId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load nail artist detail.");
}

export async function createNailArtist(data) {
  console.log("Sending createNailArtist request with data:", data);
  console.log("Headers:", getAuthHeaders());
  
  // Try wrapping data in request object first (common API pattern)
  const requestPayload = { request: data };
  
  try {
    const response = await axiosClient.post(`/NailArtists`, requestPayload, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to create nail artist.");
  } catch (error) {
    console.error("Error creating nail artist full response:", error.response?.data || error);
    console.error("Validation errors:", error.response?.data?.errors);
    
    // If wrapped request failed, try sending without wrapping as fallback
    if (error.response?.data?.errors?.request) {
      console.log("Trying without request wrapper...");
      const response = await axiosClient.post(`/NailArtists`, data, {
        headers: getAuthHeaders(),
      });
      return unwrapResponse(response, "Failed to create nail artist.");
    }
    
    // Build a more descriptive error message from validation errors
    let errorMessage = error.response?.data?.message || error.message || "Failed to create nail artist.";
    if (error.response?.data?.errors) {
      const validationErrors = Object.entries(error.response.data.errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
      errorMessage += ` (${validationErrors})`;
    }
    throw new Error(errorMessage);
  }
}

export async function updateNailArtist(artistId, data) {
  const normalizedId = String(artistId || "").trim();

  if (!normalizedId) {
    throw new Error("Nail artist ID is required.");
  }

  const response = await axiosClient.put(`/NailArtists/${normalizedId}`, data, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to update nail artist.");
}

export async function deleteNailArtist(artistId) {
  const normalizedId = String(artistId || "").trim();

  if (!normalizedId) {
    throw new Error("Nail artist ID is required.");
  }

  const response = await axiosClient.delete(`/NailArtists/${normalizedId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete nail artist.");
}

export async function fetchNailArtistSkills(artistId) {
  const normalizedId = String(artistId || "").trim();

  if (!normalizedId) {
    throw new Error("Nail artist ID is required.");
  }

  const response = await axiosClient.get(`/nail-artists/${normalizedId}/skills`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load nail artist skills.");
}
