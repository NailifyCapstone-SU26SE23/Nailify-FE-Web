import dayjs from "dayjs";
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

export function getStaffArtistId() {
  const session = loadAuthSession();
  const artistId = session?.user?.staffId || session?.staffId || session?.user?.id || session?.userId;

  if (!artistId) {
    throw new Error("Staff ID is not available in the current session.");
  }

  return String(artistId).trim();
}

function normalizeTimeValue(value, fallbackDate) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return null;
  }

  if (dayjs(normalized).isValid()) {
    return dayjs(normalized);
  }

  const [hours, minutes = "00", seconds = "00"] = normalized.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  const parsedSeconds = Number(seconds);

  if (
    !Number.isFinite(parsedHours)
    || !Number.isFinite(parsedMinutes)
    || !Number.isFinite(parsedSeconds)
  ) {
    return null;
  }

  return dayjs(fallbackDate)
    .hour(parsedHours)
    .minute(parsedMinutes)
    .second(parsedSeconds)
    .millisecond(0);
}

function mapScheduleItem(item) {
  const workDate = dayjs(item?.workDate);
  const shiftStart = normalizeTimeValue(item?.shiftStart, workDate);
  const shiftEnd = normalizeTimeValue(item?.shiftEnd, workDate);

  return {
    scheduleId: String(item?.scheduleId || "").trim(),
    nailArtistId: String(item?.nailArtistId || "").trim(),
    workDate: workDate.isValid() ? workDate.toISOString() : "",
    shiftStart: shiftStart?.toISOString() || "",
    shiftEnd: shiftEnd?.toISOString() || "",
    status: String(item?.status || "Unknown").trim() || "Unknown",
  };
}

export async function fetchStaffSchedules({
  artistId = getStaffArtistId(),
  startDate,
  endDate,
} = {}) {
  const normalizedArtistId = String(artistId || "").trim();

  if (!normalizedArtistId) {
    throw new Error("Artist ID is required.");
  }

  const response = await axiosClient.get(`/Schedules/artist/${normalizedArtistId}`, {
    headers: getAuthHeaders(),
    params: {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
  });

  const data = unwrapResponse(response, "Failed to load staff schedules.");
  const scheduleRows = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

  return scheduleRows.map(mapScheduleItem);
}
