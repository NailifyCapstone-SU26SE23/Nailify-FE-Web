import { useEffect, useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    const rawValue = window.localStorage.getItem(key);

    if (rawValue === null) {
      return initialValue;
    }

    try {
      return JSON.parse(rawValue);
    } catch {
      return rawValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(storedValue));
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
