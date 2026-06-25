import { AUTH_STORAGE_KEY } from "../constants/authConstants";

export function loadAuthSession() {
  const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveAuthSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
