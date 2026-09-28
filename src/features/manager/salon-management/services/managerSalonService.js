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

export async function fetchManagerSalonDetail(salonId) {
  const normalizedSalonId = String(salonId || "").trim();

  if (!normalizedSalonId) {
    throw new Error("Salon ID is required.");
  }

  try {
    const response = await axiosClient.get(`/Salons/${normalizedSalonId}`, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to load salon detail.");
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to load salon details.");
  }
}

export async function updateManagerSalon(salonId, formData) {
  const normalizedId = String(salonId || "").trim();

  if (!normalizedId) {
    throw new Error("Salon ID is required.");
  }

  try {
    const form = new FormData();
    form.append("Name", formData.name);
    form.append("Address", formData.address);
    form.append("Phone", formData.phone);
    form.append("Latitude", formData.latitude || 0);
    form.append("Longitude", formData.longitude || 0);
    form.append("Status", formData.status || "Open");
    form.append("DepositConfig", formData.depositConfig || 0);

    const response = await axiosClient.put(`/Salons/${normalizedId}`, form, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    return unwrapResponse(response, "Failed to update salon.");
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to update salon.");
  }
}

export async function uploadManagerSalonImage(salonId, imageFile) {
  const normalizedId = String(salonId || "").trim();
  if (!normalizedId) throw new Error("Salon ID is required.");
  if (!imageFile) throw new Error("Image file is required.");

  try {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await axiosClient.post(`/Salons/${normalizedId}/upload-image`, formData, {
      headers: { ...getAuthHeaders() },
    });
    return unwrapResponse(response, "Failed to upload salon image.");
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to upload salon image.");
  }
}

export async function fetchManagerSalonOffDates(salonId) {
  const normalizedId = String(salonId || "").trim();
  if (!normalizedId) throw new Error("Salon ID is required.");

  try {
    const response = await axiosClient.get(`/SalonOffDates/salons/${normalizedId}`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load salon off dates.");
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to load salon off dates.");
  }
}

export async function createManagerSalonOffDate(salonId, data) {
  const normalizedId = String(salonId || "").trim();
  if (!normalizedId) throw new Error("Salon ID is required.");

  try {
    const response = await axiosClient.post(`/SalonOffDates/salons/${normalizedId}`, data, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to create off date.");
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to create off date.");
  }
}

export async function updateManagerSalonOffDate(offDateId, data) {
  const normalizedId = String(offDateId || "").trim();
  if (!normalizedId) throw new Error("Off date ID is required.");

  try {
    const response = await axiosClient.put(`/SalonOffDates/${normalizedId}`, data, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to update off date.");
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to update off date.");
  }
}

export async function deleteManagerSalonOffDate(offDateId) {
  const normalizedId = String(offDateId || "").trim();
  if (!normalizedId) throw new Error("Off date ID is required.");

  try {
    const response = await axiosClient.delete(`/SalonOffDates/${normalizedId}`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to delete off date.");
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to delete off date.");
  }
}

export async function updateManagerSalonOperatingHours(salonId, operatingHoursData) {
  const normalizedId = String(salonId || "").trim();
  if (!normalizedId) throw new Error("Salon ID is required.");

  try {
    const response = await axiosClient.put(`/Salons/${normalizedId}/operating-hours`, operatingHoursData, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to update operating hours.");
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to update operating hours.");
  }
}
