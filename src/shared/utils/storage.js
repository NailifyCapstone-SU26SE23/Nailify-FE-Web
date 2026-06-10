export const storage = {
  get(key, fallback = null) {
    const rawValue = window.localStorage.getItem(key);

    if (rawValue === null) {
      return fallback;
    }

    try {
      return JSON.parse(rawValue);
    } catch {
      return rawValue;
    }
  },
  remove(key) {
    window.localStorage.removeItem(key);
  },
  set(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  },
};
