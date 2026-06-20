import { createSlice } from "@reduxjs/toolkit";
import { storage } from "../shared/utils/storage";

const SERVICE_SESSION_STORAGE_KEY = "nailify.staff.service-session";

function loadPersistedSessions() {
  const persistedValue = storage.get(SERVICE_SESSION_STORAGE_KEY, {});

  return persistedValue && typeof persistedValue === "object" ? persistedValue : {};
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
      };
    },
  },
});

export const SERVICE_SESSION_STORAGE = {
  key: SERVICE_SESSION_STORAGE_KEY,
};

export const { clearServiceSession, setServiceSession } = serviceSessionSlice.actions;
export const serviceSessionReducer = serviceSessionSlice.reducer;
