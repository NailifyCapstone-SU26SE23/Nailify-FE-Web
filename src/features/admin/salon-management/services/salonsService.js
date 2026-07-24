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

  // Handle both formats: data.items (for lists) or just data (for single items)
  if (payload.data && payload.data.items) {
    return payload.data.items;
  }
  return payload.data;
}

export async function fetchSalons(params = {}) {
  try {
    const response = await axiosClient.get(`/Salons`, {
      headers: getAuthHeaders(),
      params,
    });

    return unwrapResponse(response, "Failed to load salons.");
  } catch (error) {
    console.error("Error fetching salons:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to load salons.");
  }
}

export async function fetchSalonById(salonId) {
  const normalizedId = String(salonId || "").trim();

  if (!normalizedId) {
    throw new Error("Salon ID is required.");
  }

  try {
    const response = await axiosClient.get(`/Salons/${normalizedId}`, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to load salon details.");
  } catch (error) {
    console.error("Error fetching salon:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to load salon details.");
  }
}

export async function createSalon(formData, imageFile) {
  try {
    const form = new FormData();
    form.append("name", formData.salonName);
    form.append("address", formData.address);
    form.append("phone", formData.phone);
    form.append("latitude", "0");
    form.append("longitude", "0");
    if (imageFile) {
      form.append("image", imageFile);
    }

    const response = await axiosClient.post(`/Salons`, form, {
      headers: {
        ...getAuthHeaders(),
        // Đừng set Content-Type, để axios tự động set multipart/form-data
      },
    });

    return unwrapResponse(response, "Failed to create salon.");
  } catch (error) {
    console.error("Error creating salon:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to create salon.");
  }
}

export async function updateSalon(salonId, formData, imageFile) {
  const normalizedId = String(salonId || "").trim();

  if (!normalizedId) {
    throw new Error("Salon ID is required.");
  }

  try {
    const form = new FormData();
    form.append("name", formData.salonName);
    form.append("address", formData.address);
    form.append("phone", formData.phone);
    form.append("latitude", "0");
    form.append("longitude", "0");
    if (imageFile) {
      form.append("image", imageFile);
    }

    const response = await axiosClient.put(`/Salons/${normalizedId}`, form, {
      headers: {
        ...getAuthHeaders(),
        // Đừng set Content-Type, để axios tự động set multipart/form-data
      },
    });

    return unwrapResponse(response, "Failed to update salon.");
  } catch (error) {
    console.error("Error updating salon:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to update salon.");
  }
}

export async function deleteSalon(salonId) {
  const normalizedId = String(salonId || "").trim();

  if (!normalizedId) {
    throw new Error("Salon ID is required.");
  }

  try {
    const response = await axiosClient.delete(`/Salons/${normalizedId}`, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to delete salon.");
  } catch (error) {
    console.error("Error deleting salon:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to delete salon.");
  }
}

export async function uploadSalonImage(salonId, imageFile) {
  const normalizedId = String(salonId || "").trim();

  if (!normalizedId) {
    throw new Error("Salon ID is required.");
  }

  if (!imageFile) {
    throw new Error("Image file is required.");
  }

  try {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await axiosClient.post(`/Salons/${normalizedId}/upload-image`, formData, {
      headers: {
        ...getAuthHeaders(),
        // Đừng set Content-Type, để axios tự động set multipart/form-data
      },
    });

    return unwrapResponse(response, "Failed to upload salon image.");
  } catch (error) {
    console.error("Error uploading salon image:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to upload salon image.");
  }
}

export async function updateSalonOperatingHours(salonId, operatingHoursData) {
  const normalizedId = String(salonId || "").trim();

  if (!normalizedId) {
    throw new Error("Salon ID is required.");
  }

  try {
    const response = await axiosClient.put(`/Salons/${normalizedId}/operating-hours`, operatingHoursData, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to update salon operating hours.");
  } catch (error) {
    console.error("Error updating operating hours:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to update salon operating hours.");
  }
}
