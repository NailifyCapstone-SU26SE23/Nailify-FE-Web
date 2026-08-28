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

export function getSalonId() {
  const session = loadAuthSession();
  const salonId = session?.user?.salonId || session?.salonId || localStorage.getItem("salonId") || null;
  return salonId;
}

export async function getSalonIdAsync() {
  const session = loadAuthSession();
  let salonId = session?.user?.salonId || session?.salonId || localStorage.getItem("salonId");
  if (salonId) return salonId;

  try {
    const response = await axiosClient.get("/Auth/profile", {
      headers: getAuthHeaders(),
    });
    const data = unwrapResponse(response, "Failed to load user profile");
    salonId = data?.salonId;
    if (salonId) {
      localStorage.setItem("salonId", salonId);
      return salonId;
    }
  } catch (e) {
    console.warn("Failed to fetch salonId from /Auth/profile:", e);
  }
  return null;
}



function unwrapResponse(response, fallbackMessage) {
  const payload = response?.data;

  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload.data;
}

function normalizeMetaData(metaData, defaults = {}) {
  return {
    currentPage: Number(metaData?.currentPage || defaults.pageNumber || 1),
    totalPages: Number(metaData?.totalPages || 1),
    pageSize: Number(metaData?.pageSize || defaults.pageSize || 10),
    totalItems: Number(metaData?.totalItems || 0),
    hasPrevious: Boolean(metaData?.hasPrevious),
    hasNext: Boolean(metaData?.hasNext),
    firstRowOnPage: Number(metaData?.firstRowOnPage || 0),
    lastRowOnPage: Number(metaData?.lastRowOnPage || 0),
  };
}

function mapRoleToApi(role) {
  switch (role) {
    case "NAIL_ARTIST":
      return "Staff_Artist";
    case "SALON_MANAGER":
      return "Manager";
    case "RECEPTIONIST":
      return "Receptionist";
    default:
      return role;
  }
}

function normalizeStaffMember(staff) {
  return {
    id: staff?.id || staff?.accountId || staff?.userId || "",
    nailArtistId: staff?.nailArtistId || staff?.id || "",
    accountId: staff?.accountId || staff?.userId || staff?.id || "",
    staffId: staff?.staffId || staff?.id || "",
    userId: staff?.userId || staff?.accountId || staff?.id || "",
    fullName: staff?.fullName || staff?.name || (staff?.firstName && staff?.lastName ? `${staff.firstName} ${staff.lastName}` : "Staff Member"),
    firstName: staff?.firstName || "",
    lastName: staff?.lastName || "",
    email: staff?.email || "",
    role: staff?.role || "Staff_Artist",
    status: staff?.status || "Active",
    phone: staff?.phone || "",
    salonId: staff?.salonId || "",
    avatarUrl: staff?.avatarUrl || "",
  };
}

export async function fetchNailArtistProfiles(salonId) {
  try {
    const id = salonId || getSalonId();
    if (!id) return [];
    const response = await axiosClient.get("/NailArtists", {
      headers: getAuthHeaders(),
      params: { salonId: id, pageSize: 100 },
    });

    const data = unwrapResponse(response, "Failed to load Staff Artist profiles.");
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    return items.map(normalizeStaffMember);
  } catch (error) {
    console.warn("Failed to fetch Staff Artist profiles from /NailArtists:", error);
    return [];
  }
}

export async function fetchNailArtists(salonId) {
  try {
    const id = typeof salonId === "string" ? salonId : salonId?.salonId || getSalonId();
    if (!id) return [];
    const profiles = await fetchNailArtistProfiles(id);
    if (profiles.length > 0) return profiles;

    const response = await axiosClient.get(`/Users/salon/${id}/staff`, {
      headers: getAuthHeaders(),
      params: { role: "Staff_Artist" },
    });

    const data = unwrapResponse(response, "Failed to load Staff Artists.");
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    return items.map(normalizeStaffMember);
  } catch (error) {
    console.warn("Failed to load Staff Artists with current salon.", error);
    return [];
  }
}

export async function fetchAllSalonStaff(salonId) {
  const id = salonId || getSalonId();
  const response = await axiosClient.get(`/Users/salon/${id}/staff`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load salon staff.");
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return items.map(normalizeStaffMember);
}

export async function fetchNailArtistById(artistId) {
  const normalizedId = String(artistId || "").trim();

  if (!normalizedId) {
    throw new Error("Staff Artist ID is required.");
  }

  const response = await axiosClient.get(`/NailArtists/${normalizedId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load Staff Artist detail.");
}

export async function createUser(userData) {
  const formData = new FormData();
  formData.append("email", String(userData?.email || "").trim());
  formData.append("password", String(userData?.password || ""));
  formData.append("firstName", String(userData?.firstName || "").trim());
  formData.append("lastName", String(userData?.lastName || "").trim());
  formData.append("phone", String(userData?.phone || "").trim());
  formData.append("avatarUrl", String(userData?.avatarUrl || "").trim());
  formData.append("role", mapRoleToApi(userData?.role));
  formData.append("salonId", String(userData?.salonId || "").trim());

  if (userData?.imageFile) {
    formData.append("image", userData.imageFile);
  }

  const response = await axiosClient.post("/Users", formData, {
    headers: getAuthHeaders(),
  });

  return normalizeStaffMember(unwrapResponse(response, "Failed to create user."));
}

export async function updateUser(userId, userData) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    throw new Error("User ID is required.");
  }

  let response;

  if (userData?.imageFile) {
    const formData = new FormData();

    if (userData?.email !== undefined) {
      formData.append("email", String(userData.email || "").trim());
    }
    if (userData?.firstName !== undefined) {
      formData.append("firstName", String(userData.firstName || "").trim());
    }
    if (userData?.lastName !== undefined) {
      formData.append("lastName", String(userData.lastName || "").trim());
    }
    if (userData?.phone !== undefined) {
      formData.append("phone", String(userData.phone || "").trim());
    }
    if (userData?.avatarUrl !== undefined) {
      formData.append("avatarUrl", String(userData.avatarUrl || "").trim());
    }
    if (userData?.role !== undefined) {
      formData.append("role", mapRoleToApi(userData.role));
    }
    if (userData?.salonId !== undefined) {
      formData.append("salonId", String(userData.salonId || "").trim());
    }
    if (userData?.status !== undefined) {
      formData.append("status", String(userData.status || "").trim());
    }

    formData.append("image", userData.imageFile);

    response = await axiosClient.put(`/Users/${normalizedUserId}`, formData, {
      headers: getAuthHeaders(),
    });
  } else {
    const jsonData = {};

    if (userData?.email !== undefined) {
      jsonData.email = String(userData.email || "").trim();
    }
    if (userData?.firstName !== undefined) {
      jsonData.firstName = String(userData.firstName || "").trim();
    }
    if (userData?.lastName !== undefined) {
      jsonData.lastName = String(userData.lastName || "").trim();
    }
    if (userData?.phone !== undefined) {
      jsonData.phone = String(userData.phone || "").trim();
    }
    if (userData?.avatarUrl !== undefined) {
      jsonData.avatarUrl = String(userData.avatarUrl || "").trim();
    }
    if (userData?.role !== undefined) {
      jsonData.role = mapRoleToApi(userData.role);
    }
    if (userData?.salonId !== undefined) {
      jsonData.salonId = String(userData.salonId || "").trim();
    }
    if (userData?.status !== undefined) {
      jsonData.status = String(userData.status || "").trim();
    }

    response = await axiosClient.put(`/Users/${normalizedUserId}`, jsonData, {
      headers: getAuthHeaders(),
    });
  }

  return normalizeStaffMember(unwrapResponse(response, "Failed to update user."));
}

export async function createNailArtist(data) {
  const requestPayload = { request: data };

  try {
    const response = await axiosClient.post("/NailArtists", requestPayload, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to create Staff Artist.");
  } catch (error) {
    if (error.response?.data?.errors?.request) {
      const response = await axiosClient.post("/NailArtists", data, {
        headers: getAuthHeaders(),
      });
      return unwrapResponse(response, "Failed to create Staff Artist.");
    }

    let errorMessage = error.response?.data?.message || error.message || "Failed to create Staff Artist.";
    if (error.response?.data?.errors) {
      const validationErrors = Object.entries(error.response.data.errors)
        .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
        .join("; ");
      errorMessage += ` (${validationErrors})`;
    }
    throw new Error(errorMessage);
  }
}

export async function updateNailArtist(artistId, data) {
  const normalizedId = String(artistId || "").trim();

  if (!normalizedId) {
    throw new Error("Staff Artist ID is required.");
  }

  const response = await axiosClient.put(`/NailArtists/${normalizedId}`, data, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to update Staff Artist.");
}

export async function deleteNailArtist(artistId) {
  const normalizedId = String(artistId || "").trim();

  if (!normalizedId) {
    throw new Error("Staff Artist ID is required.");
  }

  const response = await axiosClient.delete(`/NailArtists/${normalizedId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete Staff Artist.");
}

export async function fetchSkillTypes({
  pageNumber = 1,
  pageSize = 100,
  name = "",
} = {}) {
  const response = await axiosClient.get("/SkillTypes", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      name: name || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load skill types.");
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageNumber, pageSize }),
  };
}

export async function fetchNailArtistSkills(artistId) {
  const normalizedId = String(artistId || "").trim();

  if (!normalizedId) {
    throw new Error("Staff Artist ID is required.");
  }

  const response = await axiosClient.get(`/nail-artists/${normalizedId}/skills`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load Staff Artist skills.");
  return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
}

export async function assignNailArtistSkills(artistId, skills) {
  const normalizedId = String(artistId || "").trim();

  if (!normalizedId) {
    throw new Error("Staff Artist ID is required.");
  }

  let currentSkills = [];
  try {
    currentSkills = await fetchNailArtistSkills(normalizedId);
  } catch (error) {
    console.warn("Failed to fetch current skills.", error);
  }

  const currentLevelBySkillId = new Map();
  currentSkills.forEach((skill) => {
    const skillTypeId = skill.skillTypeId || skill.SkillTypeId;
    if (skillTypeId) {
      currentLevelBySkillId.set(skillTypeId, skill.level ?? skill.Level ?? 0);
    }
  });

  const newSkills = [];
  const skillsToUpdate = [];

  skills.forEach((skill) => {
    const skillTypeId = skill.skillTypeId || skill.SkillTypeId;
    const level = skill.level ?? skill.Level ?? 0;

    if (!skillTypeId) {
      return;
    }

    if (currentLevelBySkillId.has(skillTypeId)) {
      if (currentLevelBySkillId.get(skillTypeId) !== level) {
        skillsToUpdate.push({ skillTypeId, level });
      }
    } else {
      newSkills.push({ skillTypeId, level });
    }
  });

  const errors = [];

  if (newSkills.length > 0) {
    try {
      const response = await axiosClient.post(`/nail-artists/${normalizedId}/skills`, newSkills, {
        headers: getAuthHeaders(),
      });
      unwrapResponse(response, "Failed to assign new skills to Staff Artist.");
    } catch (error) {
      console.warn("Failed to assign new skills.", error);
      errors.push(`Khong the assign ${newSkills.length} skill moi`);
    }
  }

  for (const skill of skillsToUpdate) {
    try {
      await axiosClient.put(
        `/nail-artists/${normalizedId}/skills/${skill.skillTypeId}`,
        { requiredLevel: skill.level },
        { headers: getAuthHeaders() },
      );
    } catch (error) {
      console.warn(`Failed to update skill ${skill.skillTypeId}.`, error);
      errors.push(`Khong the update level skill ${skill.skillTypeId}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join("; ") };
  }

  return { success: true };
}


