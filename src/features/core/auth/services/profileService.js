import { axiosClient } from "../../../../lib/axiosClient";
import { loadAuthSession } from "../model/authStorage";

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

export function normalizeProfile(profile) {
  const firstName = String(profile?.firstName || "").trim();
  const lastName = String(profile?.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Nailify User";

  return {
    userId: String(profile?.userId || "").trim(),
    email: String(profile?.email || "").trim(),
    phone: String(profile?.phone || "").trim(),
    firstName,
    lastName,
    fullName,
    avatarUrl: String(profile?.avatarUrl || "").trim(),
    status: String(profile?.status || "").trim() || "--",
    role: String(profile?.role || "").trim() || "--",
    salonId: String(profile?.salonId || "").trim(),
    staffId: String(profile?.staffId || "").trim(),
  };
}

export function normalizeSalonDetail(salon) {
  return {
    salonId: String(salon?.salonId || "").trim(),
    name: String(salon?.name || "").trim() || "Nailify Salon",
    address: String(salon?.address || "").trim(),
    phone: String(salon?.phone || "").trim(),
    latitude: Number(salon?.latitude || 0),
    longitude: Number(salon?.longitude || 0),
    status: String(salon?.status || "").trim() || "--",
    imageUrl: String(salon?.imageUrl || "").trim(),
    operatingHours: Array.isArray(salon?.operatingHours)
      ? salon.operatingHours.map((item) => ({
          dayOfWeek: Number(item?.dayOfWeek || 0),
          dayName: String(item?.dayName || "").trim() || "--",
          openTime: String(item?.openTime || "").trim(),
          closeTime: String(item?.closeTime || "").trim(),
          isClosed: Boolean(item?.isClosed),
        }))
      : [],
  };
}

export async function fetchCurrentProfile() {
  const response = await axiosClient.get("/Profile", {
    headers: getAuthHeaders(),
  });

  return normalizeProfile(unwrapResponse(response, "Failed to load profile."));
}

export async function updateCurrentProfile(formValues) {
  const formData = new FormData();

  if (formValues?.email !== undefined) {
    formData.append("Email", String(formValues.email || "").trim());
  }
  if (formValues?.firstName !== undefined) {
    formData.append("FirstName", String(formValues.firstName || "").trim());
  }
  if (formValues?.lastName !== undefined) {
    formData.append("LastName", String(formValues.lastName || "").trim());
  }
  if (formValues?.phone !== undefined) {
    formData.append("Phone", String(formValues.phone || "").trim());
  }
  if (formValues?.imageFile) {
    formData.append("image", formValues.imageFile);
  }

  await axiosClient.put("/Profile", formData, {
    headers: getAuthHeaders(),
  });

  return fetchCurrentProfile();
}

export async function deactivateCurrentProfile() {
  const response = await axiosClient.delete("/Profile", {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to deactivate account.");
}

export async function fetchProfileSalonDetail(salonId) {
  const normalizedSalonId = String(salonId || "").trim();

  if (!normalizedSalonId) {
    return null;
  }

  const response = await axiosClient.get(`/Salons/${normalizedSalonId}`, {
    headers: getAuthHeaders(),
  });

  return normalizeSalonDetail(unwrapResponse(response, "Failed to load salon detail."));
}
