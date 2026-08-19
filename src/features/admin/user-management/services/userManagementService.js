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

function normalizeStatus(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  switch (normalizedStatus) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "suspended":
      return "Suspended";
    case "pending":
      return "Pending";
    default:
      return status;
  }
}

function normalizeRole(role) {
  const normalizedRole = String(role || "").trim().toLowerCase();

  switch (normalizedRole) {
    case "staff_artist":
      return "Staff";
    case "manager":
      return "Manager";
    case "receptionist":
      return "Receptionist";
    case "admin":
      return "Admin";
    case "customer":
      return "Customer";
    default:
      return role;
  }
}

function getDisplayRole(role) {
  switch (role) {
    case "Staff":
      return "Staff Artist";
    case "Manager":
      return "Salon Manager";
    default:
      return role;
  }
}

function getAvatar(name) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getJoinedAtLabel() {
  return "Loaded from API";
}

function getLastActiveLabel(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  switch (normalizedStatus) {
    case "active":
      return "Available now";
    case "pending":
      return "Pending activation";
    case "suspended":
      return "Access restricted";
    case "inactive":
      return "Inactive";
    default:
      return "Recently updated";
  }
}

export function normalizeAdminUser(user) {
  const role = normalizeRole(user?.role);
  const firstName = String(user?.firstName || "").trim();
  const lastName = String(user?.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || user?.email;
  const statusLabel = normalizeStatus(user?.status);

  return {
    id: user?.userId || "",
    displayId: user?.userId || "",
    name: fullName,
    firstName,
    lastName,
    email: user?.email,
    phone: String(user?.phone).trim(),
    role,
    rawRole: String(user?.role || "").trim(),
    displayRole: getDisplayRole(role),
    salonId: user?.salonId || "",
    salon: user?.salonId ? "Assigned salon" : "No salon",
    salonId: user?.salonId || "",
    staffId: user?.staffId || "",
    avatar: getAvatar(fullName),
    avatarUrl: user?.avatarUrl || "",
    status: statusLabel,
    statusLabel,
    lastActive: getLastActiveLabel(statusLabel),
    joinedAt: getJoinedAtLabel(),
    notes: "",
  };
}

export async function fetchAdminUsers({
  pageNumber = 1,
  pageSize = 10,
  searchTerm = "",
  role = "",
  salonId = "",
} = {}) {
  const response = await axiosClient.get("/Users", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      searchTerm: searchTerm || undefined,
      role: mapRoleToApi(role) || undefined,
      salonId: salonId || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load users.");
  const items = Array.isArray(data?.items) ? data.items.map(normalizeAdminUser) : [];
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

export async function fetchAdminUserDetail(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    throw new Error("User ID is required.");
  }

  const response = await axiosClient.get(`/Users/${normalizedUserId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load user detail.");

  return normalizeAdminUser(data);
}

// New function to fetch raw user data without normalization
export async function fetchRawAdminUserDetail(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    throw new Error("User ID is required.");
  }

  const response = await axiosClient.get(`/Users/${normalizedUserId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load user detail.");
}

function mapRoleToApi(role) {
  switch (role) {
    case "Staff":
      return "Staff_Artist";
    default:
      return role;
  }
}

const isSalonRole = (role) => {
  const normalized = String(role || "").trim().toLowerCase();
  return ["staff", "staff_artist", "receptionist", "manager"].includes(normalized);
};

export async function createAdminUser(formValues) {
  const formData = new FormData();
  formData.append("Email", String(formValues?.email || "").trim());
  formData.append("Password", String(formValues?.password || ""));
  formData.append("FirstName", String(formValues?.firstName || "").trim());
  formData.append("LastName", String(formValues?.lastName || "").trim());
  formData.append("Phone", String(formValues?.phone || "").trim());
  formData.append("AvatarUrl", String(formValues?.avatarUrl || "").trim());
  formData.append("Role", mapRoleToApi(formValues?.role));

  if (isSalonRole(formValues?.role)) {
    const sId = String(formValues?.salonId || "").trim();
    if (sId) {
      formData.append("SalonId", sId);
    }
  }

  if (formValues?.imageFile) {
    formData.append("image", formValues.imageFile);
  }

  const response = await axiosClient.post(
    "/Users",
    formData,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = unwrapResponse(response, "Failed to create user.");

  return normalizeAdminUser(data);
}

export async function updateAdminUser(userId, formValues) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    throw new Error("User ID is required.");
  }

  // Only include fields that are expected by the API
  const payload = {};
  if (formValues?.email !== undefined) payload.email = String(formValues.email || "").trim();
  if (formValues?.firstName !== undefined) payload.firstName = String(formValues.firstName || "").trim();
  if (formValues?.lastName !== undefined) payload.lastName = String(formValues.lastName || "").trim();
  if (formValues?.phone !== undefined) payload.phone = String(formValues.phone || "").trim();
  if (formValues?.status !== undefined) payload.status = String(formValues.status || "").trim();

  if (isSalonRole(formValues?.role)) {
    const sId = String(formValues?.salonId || "").trim();
    payload.salonId = sId ? sId : null;
  } else {
    payload.salonId = null;
  }

  console.log("updateAdminUser - userId:", normalizedUserId);
  console.log("updateAdminUser - payload:", payload);

  try {
    const response = await axiosClient.put(
      `/Users/${normalizedUserId}`,
      payload,
      {
        headers: getAuthHeaders(),
      },
    );

    const data = unwrapResponse(response, "Failed to update user.");

    return normalizeAdminUser(data);
  } catch (error) {
    console.error("updateAdminUser error response:", error.response?.data);
    throw error;
  }
}

export async function deleteAdminUser(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    throw new Error("User ID is required.");
  }

  const response = await axiosClient.delete(`/Users/${normalizedUserId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete user.");
}
