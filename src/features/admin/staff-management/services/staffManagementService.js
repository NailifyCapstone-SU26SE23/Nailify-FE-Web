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

export function normalizeStaffMember(staff) {
  console.log("normalizeStaffMember input (full):", staff);
  const fullName = staff?.firstName && staff?.lastName 
    ? `${staff.firstName} ${staff.lastName}` 
    : staff?.fullName || staff?.name || "Unnamed Staff";
  
  const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "S";
  
  const result = {
    ...staff, // Keep all original fields FIRST
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
  console.log("normalizeStaffMember result (full):", result);
  return result;
}

export async function fetchSalonStaff(salonId, { pageIndex = 1, pageSize = 20, role = null } = {}) {
  const normalizedSalonId = String(salonId || "").trim();

  if (!normalizedSalonId) {
    return { items: [], metaData: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: 20 } };
  }

  try {
    const params = {
      pageNumber: pageIndex,
      pageSize,
    };
    
    if (role) {
      params.role = role;
    }
    
    const response = await axiosClient.get(`/Users/salon/${normalizedSalonId}/staff`, {
      headers: getAuthHeaders(),
      params,
    });

    const data = unwrapResponse(response, "Failed to load salon staff.");
    const items = Array.isArray(data?.items) ? data.items.map(normalizeStaffMember) : [];
    const metaData = data?.metaData ?? {};

    return {
      items,
      metaData: {
        currentPage: Number(metaData.currentPage || pageIndex || 1),
        totalPages: Number(metaData.totalPages || 1),
        pageSize: Number(metaData.pageSize || pageSize || 20),
        totalItems: Number(metaData.totalItems || items.length),
        hasPrevious: Boolean(metaData.hasPrevious),
        hasNext: Boolean(metaData.hasNext),
        firstRowOnPage: Number(metaData.firstRowOnPage || (items.length ? 1 : 0)),
        lastRowOnPage: Number(metaData.lastRowOnPage || items.length),
      },
    };
  } catch (error) {
    console.error("Error fetching salon staff:", error);
    return { items: [], metaData: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: 20 } };
  }
}



function mapRoleToApi(role) {
  switch (role) {
    case "NAIL_ARTIST":
      return "Staff_Artist";
    case "SALON_MANAGER":
      return "Salon_Manager";
    case "RECEPTIONIST":
      return "Receptionist";
    default:
      return role;
  }
}

// Create new user
export async function createUser(userData) {
  try {
    console.log("Creating user with data:", userData);
    
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

    // Log form data entries
    console.log("Form data entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    const response = await axiosClient.post("/Users", formData, {
      headers: getAuthHeaders(),
    });

    console.log("Create user response:", response);
    const data = unwrapResponse(response, "Failed to create user.");
    return normalizeStaffMember(data);
  } catch (error) {
    console.error("Error creating user full details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// Update user
export async function updateUser(userId, userData) {
  try {
    console.log("Updating user with data:", userData);
    
    let response;
    // If there's an image file to upload, use FormData
    if (userData?.imageFile) {
      const formData = new FormData();
      formData.append("email", String(userData?.email || "").trim());
      if (userData?.firstName !== undefined) {
        formData.append("firstName", String(userData?.firstName || "").trim());
      }
      if (userData?.lastName !== undefined) {
        formData.append("lastName", String(userData?.lastName || "").trim());
      }
      if (userData?.phone !== undefined) {
        formData.append("phone", String(userData?.phone || "").trim());
      }
      if (userData?.avatarUrl !== undefined) {
        formData.append("avatarUrl", String(userData?.avatarUrl || "").trim());
      }
      if (userData?.role !== undefined) {
        formData.append("role", mapRoleToApi(userData?.role));
      }
      if (userData?.salonId !== undefined) {
        formData.append("salonId", String(userData?.salonId || "").trim());
      }
      if (userData?.status !== undefined) {
        formData.append("status", String(userData?.status || "").trim());
      }
      
      formData.append("image", userData.imageFile);

      // Log form data entries
      console.log("Update user form data entries:");
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      response = await axiosClient.put(`/Users/${userId}`, formData, {
        headers: getAuthHeaders(),
      });
    } else {
      // No image, send JSON
      const jsonData = {
        email: String(userData?.email || "").trim(),
      };
      
      if (userData?.firstName !== undefined) {
        jsonData.firstName = String(userData?.firstName || "").trim();
      }
      if (userData?.lastName !== undefined) {
        jsonData.lastName = String(userData?.lastName || "").trim();
      }
      if (userData?.phone !== undefined) {
        jsonData.phone = String(userData?.phone || "").trim();
      }
      if (userData?.avatarUrl !== undefined) {
        jsonData.avatarUrl = String(userData?.avatarUrl || "").trim();
      }
      if (userData?.role !== undefined) {
        jsonData.role = mapRoleToApi(userData?.role);
      }
      if (userData?.salonId !== undefined) {
        jsonData.salonId = String(userData?.salonId || "").trim();
      }
      if (userData?.status !== undefined) {
        jsonData.status = String(userData?.status || "").trim();
      }

      console.log("Update user JSON data:", jsonData);

      response = await axiosClient.put(`/Users/${userId}`, jsonData, {
        headers: getAuthHeaders(),
      });
    }

    console.log("Update user response:", response);
    const data = unwrapResponse(response, "Failed to update user.");
    return normalizeStaffMember(data);
  } catch (error) {
    console.error("Error updating user full details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// Assign skills to nail artist
export async function assignNailArtistSkills(artistId, skills) {
  try {
    console.log("Assigning skills to artist:", artistId, "with skills:", skills);
    
    // Try wrapping in { skills } first
    let response;
    try {
      response = await axiosClient.post(`/nail-artists/${artistId}/skills`, { skills }, {
        headers: getAuthHeaders(),
      });
      console.log("Assign skills response (wrapped in { skills }):", response);
    } catch (wrapperError) {
      // If that fails, try wrapping in { request: skills }
      try {
        console.log("Trying { request: skills } wrapper...");
        response = await axiosClient.post(`/nail-artists/${artistId}/skills`, { request: skills }, {
          headers: getAuthHeaders(),
        });
        console.log("Assign skills response (wrapped in { request }):", response);
      } catch (requestError) {
        // If that also fails, try sending directly
        console.log("Trying direct skills array...");
        response = await axiosClient.post(`/nail-artists/${artistId}/skills`, skills, {
          headers: getAuthHeaders(),
        });
        console.log("Assign skills response (direct):", response);
      }
    }

    return unwrapResponse(response, "Failed to assign skills to nail artist.");
  } catch (error) {
    console.error("Error assigning skills full details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    // Don't throw, just log, so user update still completes
    console.warn("Skills assignment failed, but user update will continue");
    return null;
  }
}
