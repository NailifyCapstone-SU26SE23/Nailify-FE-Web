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

function normalizeBookingStatusKey(status) {
  return String(status || "").trim().toLowerCase();
}

function getStaffArtistId() {
  const session = loadAuthSession();
  const artistId = session?.user?.staffId || session?.staffId || session?.user?.id || session?.userId;

  if (!artistId) {
    throw new Error("Staff artist ID is not available in the current session.");
  }

  return String(artistId).trim();
}

function getStaffSalonId() {
  const session = loadAuthSession();
  const salonId = session?.user?.salonId || session?.salonId;

  if (!salonId) {
    throw new Error("Salon ID is not available in the current session.");
  }

  return String(salonId).trim();
}

function pickTrimmedString(...values) {
  for (const value of values) {
    const normalized = String(value || "").trim();

    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function pickNumber(...values) {
  for (const value of values) {
    const normalized = Number(value);

    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return 0;
}

export function normalizeTask(task, fallbackTask = {}) {
  return {
    bookingProcedureId: pickTrimmedString(task?.bookingProcedureId, fallbackTask?.bookingProcedureId),
    bookingItemId: pickTrimmedString(task?.bookingItemId, fallbackTask?.bookingItemId),
    procedureId: pickTrimmedString(task?.procedureId, fallbackTask?.procedureId),
    procedureName: pickTrimmedString(task?.procedureName, fallbackTask?.procedureName) || "Unnamed Procedure",
    description: pickTrimmedString(task?.description, fallbackTask?.description),
    stepOrder: pickNumber(task?.stepOrder, fallbackTask?.stepOrder),
    status: pickTrimmedString(task?.status, fallbackTask?.status) || "Pending",
    completedAt: task?.completedAt || null,
    completedById: pickTrimmedString(task?.completedById, fallbackTask?.completedById),
    completedByName: pickTrimmedString(task?.completedByName, fallbackTask?.completedByName),
    isRequired: typeof task?.isRequired === "boolean" ? task.isRequired : Boolean(fallbackTask?.isRequired),
    assignedArtistId: pickTrimmedString(task?.assignedArtistId, fallbackTask?.assignedArtistId),
    assignedArtistName: pickTrimmedString(task?.assignedArtistName, fallbackTask?.assignedArtistName),
    estimatedStartTime: pickTrimmedString(task?.estimatedStartTime, fallbackTask?.estimatedStartTime),
    estimatedEndTime: pickTrimmedString(task?.estimatedEndTime, fallbackTask?.estimatedEndTime),
    actualStartTime: pickTrimmedString(task?.actualStartTime, fallbackTask?.actualStartTime),
    actualEndTime: pickTrimmedString(task?.actualEndTime, fallbackTask?.actualEndTime),
    duration: pickNumber(task?.duration, fallbackTask?.duration),
    activeDuration: pickNumber(task?.activeDuration, fallbackTask?.activeDuration),
    passiveDuration: pickNumber(task?.passiveDuration, fallbackTask?.passiveDuration),
    canOverlap: typeof task?.canOverlap === "boolean" ? task.canOverlap : Boolean(fallbackTask?.canOverlap),
    isMainStep: typeof task?.isMainStep === "boolean" ? task.isMainStep : Boolean(fallbackTask?.isMainStep),
    bookingId: pickTrimmedString(task?.bookingId, fallbackTask?.bookingId),
    customerName: pickTrimmedString(task?.customerName, fallbackTask?.customerName) || "Unknown Customer",
    chairName: pickTrimmedString(task?.chairName, fallbackTask?.chairName),
    bookingDate: task?.bookingDate || fallbackTask?.bookingDate || null,
    startTime: pickTrimmedString(task?.startTime, fallbackTask?.startTime),
  };
}

export async function fetchBookingProceduresByBookingItem(bookingItemId) {
  const normalizedBookingItemId = String(bookingItemId || "").trim();

  if (!normalizedBookingItemId) {
    return [];
  }

  const response = await axiosClient.get(`/BookingProcedures/booking-item/${normalizedBookingItemId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load booking procedures.");
  return Array.isArray(data) ? data : [];
}

export async function fetchAssignedStaffTasks(artistId = getStaffArtistId()) {
  const normalizedArtistId = String(artistId || "").trim();

  if (!normalizedArtistId) {
    throw new Error("Artist ID is required.");
  }

  const response = await axiosClient.get(`/BookingProcedures/artist/${normalizedArtistId}/tasks`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load assigned tasks.");
  return Array.isArray(data) ? data.map(normalizeTask) : [];
}

export async function fetchClaimableSalonTasks(salonId = getStaffSalonId()) {
  const normalizedSalonId = String(salonId || "").trim();

  const response = await axiosClient.get("/BookingProcedures/claimable", {
    headers: getAuthHeaders(),
    params: {
      salonId: normalizedSalonId || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load claimable salon tasks.");
  return Array.isArray(data) ? data.map(normalizeTask) : [];
}

export async function fetchSalonQueueTasks(salonId = getStaffSalonId()) {
  const claimableTasks = await fetchClaimableSalonTasks(salonId);
  const visibleClaimableTasks = await filterTasksByBookingInProgress(claimableTasks);

  if (visibleClaimableTasks.length === 0) {
    return [];
  }

  const bookingIds = [...new Set(
    visibleClaimableTasks
      .map((task) => pickTrimmedString(task?.bookingId))
      .filter(Boolean),
  )];

  const bookingResults = await Promise.allSettled(
    bookingIds.map(async (bookingId) => {
      const booking = await fetchStaffTaskBookingDetail(bookingId);

      return {
        bookingId,
        booking,
      };
    }),
  );

  const bookingItemMetaMap = new Map();
  const bookingItemIds = [];

  bookingResults.forEach((result) => {
    if (result.status !== "fulfilled") {
      return;
    }

    const { bookingId, booking } = result.value;
    const fallbackTask = visibleClaimableTasks.find((task) => task.bookingId === bookingId) || {};
    const bookingItems = Array.isArray(booking?.bookingItems) ? booking.bookingItems : [];

    bookingItems.forEach((bookingItem) => {
      const bookingItemId = pickTrimmedString(bookingItem?.bookingItemId, bookingItem?.id);

      if (!bookingItemId) {
        return;
      }

      bookingItemIds.push(bookingItemId);
      bookingItemMetaMap.set(bookingItemId, {
        bookingId,
        bookingItemId,
        customerName: pickTrimmedString(
          booking?.customerName,
          fallbackTask?.customerName,
        ),
        chairName: pickTrimmedString(
          booking?.chairName,
          booking?.chair?.chairName,
          booking?.chair?.name,
          fallbackTask?.chairName,
        ),
        bookingDate: booking?.bookingDate || fallbackTask?.bookingDate || null,
        startTime: pickTrimmedString(
          booking?.startTime,
          fallbackTask?.startTime,
        ),
      });
    });
  });

  const uniqueBookingItemIds = [...new Set(bookingItemIds)];

  if (uniqueBookingItemIds.length === 0) {
    return visibleClaimableTasks;
  }

  const procedureResults = await Promise.allSettled(
    uniqueBookingItemIds.map(async (bookingItemId) => ({
      bookingItemId,
      procedures: await fetchBookingProceduresByBookingItem(bookingItemId),
    })),
  );

  const taskMap = new Map();
  const claimableTaskMap = new Map(
    visibleClaimableTasks.map((task) => [task.bookingProcedureId, task]),
  );

  procedureResults.forEach((result) => {
    if (result.status !== "fulfilled") {
      return;
    }

    const { bookingItemId, procedures } = result.value;
    const bookingItemMeta = bookingItemMetaMap.get(bookingItemId) || {};

    procedures.forEach((procedure) => {
      const procedureId = pickTrimmedString(procedure?.bookingProcedureId);

      if (!procedureId) {
        return;
      }

      taskMap.set(
        procedureId,
        normalizeTask(procedure, {
          ...bookingItemMeta,
          ...(claimableTaskMap.get(procedureId) || {}),
        }),
      );
    });
  });

  visibleClaimableTasks.forEach((task) => {
    if (!task?.bookingProcedureId || taskMap.has(task.bookingProcedureId)) {
      return;
    }

    taskMap.set(task.bookingProcedureId, task);
  });

  return [...taskMap.values()];
}

export async function fetchStaffTaskBookingDetail(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.get(`/Bookings/${normalizedBookingId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load booking detail.");
}

export async function filterTasksByBookingInProgress(tasks) {
  const normalizedTasks = Array.isArray(tasks) ? tasks : [];
  const bookingIds = [...new Set(
    normalizedTasks
      .map((task) => String(task?.bookingId || "").trim())
      .filter(Boolean),
  )];

  if (bookingIds.length === 0) {
    return [];
  }

  const bookingResults = await Promise.allSettled(
    bookingIds.map(async (bookingId) => {
      const booking = await fetchStaffTaskBookingDetail(bookingId);
      return {
        bookingId,
        status: normalizeBookingStatusKey(booking?.status),
      };
    }),
  );

  const visibleBookingIds = new Set();

  bookingResults.forEach((result) => {
    if (result.status !== "fulfilled") {
      return;
    }

    if (result.value.status === "in progress" || result.value.status === "inprogress") {
      visibleBookingIds.add(result.value.bookingId);
    }
  });

  return normalizedTasks.filter((task) => visibleBookingIds.has(String(task?.bookingId || "").trim()));
}

export async function filterClaimableTasksByBookingInProgress(tasks) {
  return filterTasksByBookingInProgress(tasks);
}

export async function claimStaffTask(bookingProcedureId) {
  const normalizedBookingProcedureId = String(bookingProcedureId || "").trim();

  if (!normalizedBookingProcedureId) {
    throw new Error("Booking procedure ID is required.");
  }

  const response = await axiosClient.post(
    `/BookingProcedures/procedures/${normalizedBookingProcedureId}/claim`,
    null,
    {
      headers: getAuthHeaders(),
    },
  );

  return normalizeTask(unwrapResponse(response, "Failed to claim task."));
}

export async function updateStaffTaskStatus(
  bookingProcedureId,
  status,
  artistId = getStaffArtistId(),
) {
  const normalizedBookingProcedureId = String(bookingProcedureId || "").trim();
  const normalizedStatus = String(status || "").trim();
  const normalizedArtistId = String(artistId || "").trim();

  if (!normalizedBookingProcedureId) {
    throw new Error("Booking procedure ID is required.");
  }

  if (!normalizedArtistId) {
    throw new Error("Artist ID is required.");
  }

  if (!normalizedStatus) {
    throw new Error("Task status is required.");
  }

  const response = await axiosClient.put(
    `/BookingProcedures/${normalizedBookingProcedureId}/status`,
    null,
    {
      headers: getAuthHeaders(),
      params: {
        artistId: normalizedArtistId,
        status: normalizedStatus,
      },
    },
  );

  return normalizeTask(unwrapResponse(response, "Failed to update task status."));
}
