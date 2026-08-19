import { axiosClient } from "../../../../lib/axiosClient";
import { loadAuthSession } from "../../../core/auth/model/authStorage";
import { buildAvatarDataUrl } from "../../../../shared/utils/avatar";

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

function formatTimeValue(value) {
  if (!value) {
    return "--";
  }

  return String(value).slice(0, 5);
}

function formatOperatingHours(operatingHours) {
  if (!Array.isArray(operatingHours) || !operatingHours.length) {
    return "Operating hours unavailable";
  }

  const openDays = operatingHours.filter((item) => !item?.isClosed);
  if (!openDays.length) {
    return "Closed";
  }

  const sortedDays = [...openDays].sort(
    (left, right) => Number(left?.dayOfWeek || 0) - Number(right?.dayOfWeek || 0),
  );
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];

  return `${firstDay?.dayName?.slice(0, 3)}-${lastDay?.dayName?.slice(0, 3)} ${formatTimeValue(firstDay?.openTime)}-${formatTimeValue(firstDay?.closeTime)}`;
}

export function mapSalonOperatingHours(operatingHours) {
  const hoursMap = {
    monday: { open: "--", close: "--", closed: true },
    tuesday: { open: "--", close: "--", closed: true },
    wednesday: { open: "--", close: "--", closed: true },
    thursday: { open: "--", close: "--", closed: true },
    friday: { open: "--", close: "--", closed: true },
    saturday: { open: "--", close: "--", closed: true },
    sunday: { open: "--", close: "--", closed: true },
  };

  const keyByDayOfWeek = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };

  (Array.isArray(operatingHours) ? operatingHours : []).forEach((item) => {
    const key = keyByDayOfWeek[Number(item?.dayOfWeek)];

    if (!key) {
      return;
    }

    hoursMap[key] = {
      open: formatTimeValue(item?.openTime),
      close: formatTimeValue(item?.closeTime),
      closed: Boolean(item?.isClosed),
    };
  });

  return hoursMap;
}

function normalizeSalonStatus(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  switch (normalizedStatus) {
    case "active":
    case "open":
      return "Active";
    case "busy":
      return "Busy";
    case "closed":
    case "inactive":
      return "Closed";
    default:
      return status ? `${status}` : "Active";
  }
}

function getSalonStatusColor(status) {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-600";
    case "Busy":
      return "bg-amber-100 text-amber-600";
    case "Closed":
      return "bg-rose-100 text-rose-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getSalonImage(imageUrl, salonId) {
  if (imageUrl) {
    return imageUrl;
  }

  return buildAvatarDataUrl(salonId || "Salon");
}

export function normalizeAdminSalon(salon) {
  const status = normalizeSalonStatus(salon?.status);

  // Try all common image field names from API
  const imageUrl =
    salon?.imageUrl ||
    salon?.image ||
    salon?.avatarUrl ||
    salon?.avatar ||
    salon?.logoUrl ||
    "";

  const realId = salon?.id || salon?.salonId || "";

  return {
    id: realId,
    salonId: realId,
    name: String(salon?.name || "").trim(),
    address: String(salon?.address || "").trim(),
    manager: salon?.manager || "Unassigned",
    staffCount: salon?.staffCount || 0,
    hours: formatOperatingHours(salon?.operatingHours),
    status,
    statusColor: getSalonStatusColor(status),
    image: getSalonImage(imageUrl, salon?.name || realId),
    phone: String(salon?.phone || "").trim(),
    rating: salon?.rating || "—",
    reviews: salon?.reviewCount || "0",
    latitude: Number(salon?.latitude || 0),
    longitude: Number(salon?.longitude || 0),
    operatingHours: Array.isArray(salon?.operatingHours) ? salon.operatingHours : [],
  };
}

export async function fetchAdminSalons({
  pageIndex = 1,
  pageSize = 10,
  searchTerm = "",
  orderBy = "",
} = {}) {
  const normalizedSearch = String(searchTerm || "").trim();

  const response = await axiosClient.get("/Salons", {
    headers: getAuthHeaders(),
    params: {
      PageIndex: pageIndex,
      PageSize: pageSize,
      Name: normalizedSearch || undefined,
      Address: normalizedSearch || undefined,
      OrderBy: orderBy || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load salons.");
  // const items = Array.isArray(data?.items) ? data.items.map(normalizeAdminSalon) : [];
  const items = Array.isArray(data?.items)
    ? await Promise.all(
      data.items.map(async (salon) => {
        const normalizedSalon = normalizeAdminSalon(salon);

        const [artist, receptionist] = await Promise.all([
          fetchSalonStaffCount(normalizedSalon.salonId, "Staff_Artist"),
          fetchSalonStaffCount(normalizedSalon.salonId, "Receptionist"),
        ]);

        return {
          ...normalizedSalon,
          staffCount: artist + receptionist,
        };
      })
    )
    : [];
  const metaData = data?.metaData ?? {};

  return {
    items,
    metaData: {
      currentPage: Number(metaData.currentPage || pageIndex || 1),
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

export async function fetchSalonStaffCount(salonId, role) {
  const response = await axiosClient.get(
    `/Users/salon/${salonId}/staff`,
    {
      headers: getAuthHeaders(),
      params: {
        role,
        pageNumber: 1,
        pageSize: 1,
      },
    }
  );

  return response.data.data.metaData.totalItems;
}

export async function fetchAdminSalonDetail(salonId) {
  const normalizedSalonId = String(salonId || "").trim();

  if (!normalizedSalonId) {
    throw new Error("Salon ID is required.");
  }

  try {
    const response = await axiosClient.get(`/Salons/${normalizedSalonId}`, {
      headers: getAuthHeaders(),
    });

    const data = unwrapResponse(response, "Failed to load salon detail.");

    return normalizeAdminSalon(data);
  } catch (error) {
    if (error?.response?.status === 404) {
      const payload = error.response?.data;
      throw new Error(payload?.message || "Salon not found.");
    }

    throw error;
  }
}
