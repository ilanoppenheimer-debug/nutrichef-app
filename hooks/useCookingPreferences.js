import { useEffect, useState } from 'react';

export function usePersistedPreference({ storageKey, defaultValue, isValid }) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && isValid(saved)) return saved;
    } catch {
      // ignore storage read errors
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // ignore storage write errors
    }
  }, [storageKey, value]);

  return [value, setValue];
}
