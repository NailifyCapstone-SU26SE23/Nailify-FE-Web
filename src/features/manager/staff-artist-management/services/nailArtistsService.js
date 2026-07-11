
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

    const response = await axiosClient.get(`/Users/salon/${id}/staff`, {
      headers: getAuthHeaders(),
      params: { role: "Staff_Artist" },
    });

    return unwrapResponse(response, "Failed to load nail artists.");
  } catch (error) {
    console.warn("Failed with salonId, trying with default...", error);
    // Fallback: try with default salon id
    const response = await axiosClient.get(`/Users/salon/484c3aef-3ae1-4ad6-8aba-6b0bc6df586d/staff`, {
      headers: getAuthHeaders(),
      params: { role: "Staff_Artist" },
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

export async function fetchSchedules({ pageNumber = 1, pageSize = 200, artistId, startDate, endDate } = {}) {
  const params = { pageNumber, pageSize };
  if (artistId) params.artistId = artistId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await axiosClient.get(`/Schedules`, {
    headers: getAuthHeaders(),
    params,
  });

  return unwrapResponse(response, "Failed to load schedules.");
}

// ── Normalise a staff/user payload ────────────────────────────────────────────
export function normalizeStaffMember(staff) {
  const fullName =
    staff?.firstName && staff?.lastName
      ? `${staff.firstName} ${staff.lastName}`
      : staff?.fullName || staff?.name || "Unnamed Staff";

  const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "S";

  return {
    ...staff,
    id: staff?.staffId || staff?.userId || staff?.id || "",
    userId: staff?.userId || staff?.id || "",
    staffId: staff?.staffId || "",
    name: fullName,
    role: staff?.role || "Staff",
    email: staff?.email || "",
    phone: staff?.phone || "",
    salonId: staff?.salonId || "",
    avatarTone: "from-[#ff8ebb] to-[#ea4f93]",
    avatarUrl: staff?.avatarUrl || null,
    initials,
  };
}

// ── Fetch all skill types ─────────────────────────────────────────────────────
export async function fetchSkillTypes({ pageNumber = 1, pageSize = 100 } = {}) {
  const response = await axiosClient.get("/SkillTypes", {
    headers: getAuthHeaders(),
    params: { pageNumber, pageSize },
  });
  return unwrapResponse(response, "Failed to load skill types.");
}

// ── Assign / update nail artist skills ───────────────────────────────────────
// POST /nail-artists/{id}/skills  — for brand-new skill assignments
// PUT  /nail-artists/{id}/skills/{skillTypeId} — for updating existing levels
export async function assignNailArtistSkills(artistId, skills) {
  // Fetch currently assigned skills to diff new vs existing
  let currentSkills = [];
  try {
    const res = await axiosClient.get(`/nail-artists/${artistId}/skills`, {
      headers: getAuthHeaders(),
    });
    const payload = res?.data;
    if (payload?.isSucceeded) {
      const raw = payload.data?.items ?? payload.data ?? [];
      currentSkills = Array.isArray(raw) ? raw : [];
    }
  } catch (err) {
    console.warn("assignNailArtistSkills: could not fetch existing skills:", err);
  }

  const currentLevelById = new Map();
  currentSkills.forEach((s) => {
    const id = s.skillTypeId || s.SkillTypeId || s.id;
    if (id) currentLevelById.set(id, s.level ?? 0);
  });

  const toAdd = [];
  const toUpdate = [];

  skills.forEach((s) => {
    const level = s.level ?? 0;
    if (currentLevelById.has(s.skillTypeId)) {
      if (currentLevelById.get(s.skillTypeId) !== level) {
        toUpdate.push({ skillTypeId: s.skillTypeId, level });
      }
    } else {
      toAdd.push({ skillTypeId: s.skillTypeId, level });
    }
  });

  const errors = [];

  if (toAdd.length > 0) {
    try {
      const res = await axiosClient.post(`/nail-artists/${artistId}/skills`, toAdd, {
        headers: getAuthHeaders(),
      });
      unwrapResponse(res, "Failed to assign new skills.");
    } catch (err) {
      console.warn("assignNailArtistSkills POST error:", err);
      errors.push(`Failed to assign ${toAdd.length} new skill(s).`);
    }
  }

  for (const s of toUpdate) {
    try {
      const res = await axiosClient.put(
        `/nail-artists/${artistId}/skills/${s.skillTypeId}`,
        { requiredLevel: s.level },
        { headers: getAuthHeaders() }
      );
      unwrapResponse(res, `Failed to update skill ${s.skillTypeId}.`);
    } catch (err) {
      console.warn(`assignNailArtistSkills PUT error (${s.skillTypeId}):`, err);
      errors.push(`Failed to update skill level for ${s.skillTypeId}.`);
    }
  }

  return errors.length > 0
    ? { success: false, error: errors.join("; ") }
    : { success: true };
}

// ── Role mapping ──────────────────────────────────────────────────────────────
function mapRoleToApi(role) {
  switch (role) {
    case "NAIL_ARTIST": return "Staff_Artist";
    case "SALON_MANAGER": return "Salon_Manager";
    case "RECEPTIONIST": return "Receptionist";
    default: return role;
  }
}

// ── Create a new user account ─────────────────────────────────────────────────
export async function createUser(userData) {
  const fd = new FormData();
  fd.append("email", String(userData?.email || "").trim());
  fd.append("password", String(userData?.password || ""));
  fd.append("firstName", String(userData?.firstName || "").trim());
  fd.append("lastName", String(userData?.lastName || "").trim());
  fd.append("phone", String(userData?.phone || "").trim());
  fd.append("avatarUrl", String(userData?.avatarUrl || "").trim());
  fd.append("role", mapRoleToApi(userData?.role));
  fd.append("salonId", String(userData?.salonId || "").trim());

  if (userData?.imageFile) {
    fd.append("image", userData.imageFile);
  }

  const response = await axiosClient.post("/Users", fd, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to create user.");
  return normalizeStaffMember(data);
}

// ── Update an existing user ───────────────────────────────────────────────────
export async function updateUser(userId, userData) {
  let response;

  if (userData?.imageFile) {
    const fd = new FormData();
    if (userData.firstName !== undefined) fd.append("firstName", String(userData.firstName).trim());
    if (userData.lastName !== undefined) fd.append("lastName", String(userData.lastName).trim());
    if (userData.phone !== undefined) fd.append("phone", String(userData.phone).trim());
    if (userData.email !== undefined) fd.append("email", String(userData.email).trim());
    if (userData.role !== undefined) fd.append("role", mapRoleToApi(userData.role));
    if (userData.salonId !== undefined) fd.append("salonId", String(userData.salonId).trim());
    if (userData.status !== undefined) fd.append("status", String(userData.status).trim());
    fd.append("image", userData.imageFile);

    response = await axiosClient.put(`/Users/${userId}`, fd, {
      headers: getAuthHeaders(),
    });
  } else {
    const json = {};
    if (userData.firstName !== undefined) json.firstName = String(userData.firstName).trim();
    if (userData.lastName !== undefined) json.lastName = String(userData.lastName).trim();
    if (userData.phone !== undefined) json.phone = String(userData.phone).trim();
    if (userData.email !== undefined) json.email = String(userData.email).trim();
    if (userData.role !== undefined) json.role = mapRoleToApi(userData.role);
    if (userData.salonId !== undefined) json.salonId = String(userData.salonId).trim();
    if (userData.status !== undefined) json.status = String(userData.status).trim();

    response = await axiosClient.put(`/Users/${userId}`, json, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    });
  }

  const data = unwrapResponse(response, "Failed to update user.");
  return normalizeStaffMember(data);
}


