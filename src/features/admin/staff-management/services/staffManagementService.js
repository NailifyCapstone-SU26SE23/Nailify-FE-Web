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
      params.role = mapRoleToApi(role);
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
    case "Staff":
    case "staff":
      return "Staff_Artist";
    case "SALON_MANAGER":
    case "Manager":
    case "manager":
      return "Manager";
    case "RECEPTIONIST":
    case "Receptionist":
    case "receptionist":
      return "Receptionist";
    default:
      return role;
  }
}

// Create new user
export async function createUser(userData) {
  try {
    const formData = new FormData();
    formData.append("Email", String(userData?.email || "").trim());
    formData.append("Password", String(userData?.password || ""));
    formData.append("FirstName", String(userData?.firstName || "").trim());
    formData.append("LastName", String(userData?.lastName || "").trim());
    formData.append("Phone", String(userData?.phone || "").trim());
    formData.append("AvatarUrl", String(userData?.avatarUrl || "").trim());
    formData.append("Role", mapRoleToApi(userData?.role));
    formData.append("SalonId", String(userData?.salonId || "").trim());

    if (userData?.imageFile) {
      formData.append("image", userData.imageFile);
    }

    const response = await axiosClient.post("/Users", formData, {
      headers: getAuthHeaders(),
    });

    const data = unwrapResponse(response, "Failed to create user.");
    return normalizeStaffMember(data);
  } catch (error) {
    console.error("Error creating user:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// Update user
// NOTE: mọi field đều là optional/partial-update — chỉ field nào có mặt trong
// userData mới được gửi lên BE. Trước đây "email" bị gửi cứng ngay cả khi
// không truyền vào, có nguy cơ ghi đè email hiện tại của user thành chuỗi
// rỗng. Đã sửa để email theo cùng quy tắc "chỉ gửi nếu !== undefined" như
// các field khác.
export async function updateUser(userId, userData) {
  try {
    let response;

    // Có ảnh mới -> dùng FormData (multipart)
    if (userData?.imageFile) {
      const formData = new FormData();

      if (userData?.email !== undefined) {
        formData.append("Email", String(userData.email || "").trim());
      }
      if (userData?.firstName !== undefined) {
        formData.append("FirstName", String(userData.firstName || "").trim());
      }
      if (userData?.lastName !== undefined) {
        formData.append("LastName", String(userData.lastName || "").trim());
      }
      if (userData?.phone !== undefined) {
        formData.append("Phone", String(userData.phone || "").trim());
      }
      if (userData?.avatarUrl !== undefined) {
        formData.append("AvatarUrl", String(userData.avatarUrl || "").trim());
      }
      if (userData?.role !== undefined) {
        formData.append("Role", mapRoleToApi(userData.role));
      }
      if (userData?.salonId !== undefined) {
        formData.append("SalonId", String(userData.salonId || "").trim());
      }
      if (userData?.status !== undefined) {
        formData.append("Status", String(userData.status || "").trim());
      }

      formData.append("image", userData.imageFile);

      response = await axiosClient.put(`/Users/${userId}`, formData, {
        headers: getAuthHeaders(),
      });
    } else {
      // Không có ảnh -> gửi JSON, chỉ include field nào thực sự được truyền vào
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

      response = await axiosClient.put(`/Users/${userId}`, jsonData, {
        headers: getAuthHeaders(),
      });
    }

    const data = unwrapResponse(response, "Failed to update user.");
    return normalizeStaffMember(data);
  } catch (error) {
    console.error("Error updating user:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// Assign skills to nail artist
// NOTE QUAN TRỌNG: KHÔNG được gộp skill cũ (đã gán) và skill mới vào chung
// một mảng rồi POST hết một lượt. Endpoint POST /nail-artists/{id}/skills
// là endpoint "assign mới" (insert) — nếu gửi kèm skill đã được gán trước
// đó, BE sẽ báo lỗi trùng bản ghi và toàn bộ request thất bại, kể cả các
// skill mới thật sự cần assign. Đây chính là lý do "update level thì được,
// nhưng assign thêm skill mới thì không": PUT (update level) chỉ hoạt động
// trên skill ĐÃ tồn tại, nên fallback PUT vẫn "cứu" được phần update, còn
// skill hoàn toàn mới thì PUT tới một bản ghi chưa tồn tại sẽ luôn fail.
//
// Cách xử lý đúng: tách skill thành 2 nhóm dựa trên danh sách skill hiện có
// của artist, rồi gọi đúng API cho từng nhóm:
//   - Skill CHƯA từng được gán  -> POST (chỉ gửi phần mới này thôi)
//   - Skill ĐÃ được gán, đổi level -> PUT từng skill một
export async function assignNailArtistSkills(artistId, skills) {
  let currentSkills = [];
  try {
    const currentSkillsResponse = await axiosClient.get(
      `/nail-artists/${artistId}/skills`,
      { headers: getAuthHeaders() }
    );
    const payload = currentSkillsResponse?.data;
    if (payload?.isSucceeded) {
      currentSkills = payload.data?.items ?? payload.data ?? [];
    }
  } catch (err) {
    console.warn("Failed to fetch current skills:", err);
  }

  const currentLevelBySkillId = new Map();
  currentSkills.forEach((skill) => {
    const id = skill.skillTypeId || skill.SkillTypeId;
    if (id) currentLevelBySkillId.set(id, skill.level ?? skill.Level ?? 0);
  });

  const newSkills = [];
  const skillsToUpdate = [];

  skills.forEach((skill) => {
    const level = skill.level ?? skill.Level ?? 0;
    if (currentLevelBySkillId.has(skill.skillTypeId)) {
      // Đã gán rồi -> chỉ cần update nếu level thực sự thay đổi
      if (currentLevelBySkillId.get(skill.skillTypeId) !== level) {
        skillsToUpdate.push({ skillTypeId: skill.skillTypeId, level });
      }
    } else {
      // Chưa từng gán -> cần assign mới
      newSkills.push({ skillTypeId: skill.skillTypeId, level });
    }
  });

  const errors = [];

  // 1. Assign các skill hoàn toàn mới qua POST
  if (newSkills.length > 0) {
    try {
      const response = await axiosClient.post(
        `/nail-artists/${artistId}/skills`,
        newSkills,
        { headers: getAuthHeaders() }
      );
      unwrapResponse(response, "Failed to assign new skills to nail artist.");
    } catch (err) {
      console.warn("Failed to assign new skills:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      errors.push(`Không thể assign ${newSkills.length} skill mới`);
    }
  }

  // 2. Update level cho các skill đã tồn tại qua PUT từng skill một
  for (const skill of skillsToUpdate) {
    try {
      await axiosClient.put(
        `/nail-artists/${artistId}/skills/${skill.skillTypeId}`,
        { requiredLevel: skill.level },
        { headers: getAuthHeaders() }
      );
    } catch (err) {
      console.warn(`Failed to update skill ${skill.skillTypeId}:`, err.response?.data || err);
      errors.push(`Không thể update level skill ${skill.skillTypeId}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join("; ") };
  }

  return { success: true };
}

// Lấy lịch làm việc của 1 thợ làm móng (nail artist) trong 1 khoảng thời gian
// GET /api/Schedules/artist/{artistId}
//
// LƯU Ý: Swagger chỉ show rõ path param bắt buộc "artistId". Mô tả endpoint
// có nhắc "trong một khoảng thời gian" nên nhiều khả năng còn query params
// (ví dụ fromDate/toDate hoặc startDate/endDate) chưa xác nhận được tên
// chính xác. Hàm này viết linh hoạt:
//   - Không truyền range -> gọi endpoint không kèm query (BE tự quyết định
//     khoảng mặc định).
//   - Có truyền { fromDate, toDate } -> tự thêm vào query string.
// Nếu BE trả lỗi thiếu param hoặc field không khớp, kiểm tra lại tên param
// đúng trong Swagger rồi chỉnh lại object `params` bên dưới.
export async function fetchArtistSchedule(artistId, { fromDate, toDate } = {}) {
  const normalizedArtistId = String(artistId || "").trim();

  if (!normalizedArtistId) {
    return [];
  }

  try {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    const response = await axiosClient.get(`/Schedules/artist/${normalizedArtistId}`, {
      headers: getAuthHeaders(),
      params,
    });

    const data = unwrapResponse(response, "Failed to load artist schedule.");

    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.items)) {
      return data.items;
    }
    return [];
  } catch (error) {
    console.error("Error fetching artist schedule:", error);
    return [];
  }
}

export async function fetchTodaySchedules() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const response = await axiosClient.get("/Schedules", {
    headers: getAuthHeaders(),
    params: {
      pageNumber: 1,
      pageSize: 1000,
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    },
  });

  const data = unwrapResponse(response, "Failed to load schedules.");

  return Array.isArray(data?.items) ? data.items : [];
}