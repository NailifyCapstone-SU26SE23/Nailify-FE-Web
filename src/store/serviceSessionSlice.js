import { createSlice } from "@reduxjs/toolkit";
import { storage } from "../shared/utils/storage";

const SERVICE_SESSION_STORAGE_KEY = "nailify.staff.service-session";

function sanitizePersistedPhoto(photo) {
  const previewUrl = String(photo?.previewUrl || "").trim();

  if (!previewUrl || previewUrl.startsWith("blob:")) {
    return null;
  }

  return {
    fileName: photo?.fileName || "Uploaded photo",
    previewUrl,
    uploadedAt: photo?.uploadedAt || "Uploaded",
    fileSizeLabel: photo?.fileSizeLabel ?? null,
    uploadedToServer: Boolean(photo?.uploadedToServer),
  };
}

function sanitizeSessionPhoto(photo) {
  if (!photo || typeof photo !== "object") {
    return null;
  }

  const previewUrl = String(photo.previewUrl || "").trim();

  if (!previewUrl) {
    return null;
  }

  return {
    fileName: photo.fileName || "Uploaded photo",
    previewUrl,
    uploadedAt: photo.uploadedAt || "Uploaded",
    fileSizeLabel: photo.fileSizeLabel ?? null,
    uploadedToServer: Boolean(photo.uploadedToServer),
  };
}

function normalizeLoadedSessions(sessions) {
  if (!sessions || typeof sessions !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(sessions).map(([bookingId, session]) => [
      bookingId,
      {
        ...(session && typeof session === "object" ? session : {}),
        beforePhoto: sanitizePersistedPhoto(session?.beforePhoto),
        afterPhoto: sanitizePersistedPhoto(session?.afterPhoto),
      },
    ]),
  );
}

function loadPersistedSessions() {
  const persistedValue = storage.get(SERVICE_SESSION_STORAGE_KEY, {});

  return normalizeLoadedSessions(persistedValue);
}

const serviceSessionSlice = createSlice({
  name: "serviceSession",
  initialState: {
    sessions: loadPersistedSessions(),
  },
  reducers: {
    clearServiceSession(state, action) {
      delete state.sessions[action.payload];
    },
    setServiceSession(state, action) {
      const { bookingId, session } = action.payload ?? {};

      if (!bookingId || !session || typeof session !== "object") {
        return;
      }

      state.sessions[bookingId] = {
        ...(state.sessions[bookingId] ?? {}),
        ...session,
        beforePhoto: sanitizeSessionPhoto(session.beforePhoto),
        afterPhoto: sanitizeSessionPhoto(session.afterPhoto),
      };
    },
  },
});

export const SERVICE_SESSION_STORAGE = {
  key: SERVICE_SESSION_STORAGE_KEY,
};

export function sanitizeServiceSessionsForStorage(sessions) {
  return normalizeLoadedSessions(sessions);
}

export const { clearServiceSession, setServiceSession } = serviceSessionSlice.actions;
export const serviceSessionReducer = serviceSessionSlice.reducer;
