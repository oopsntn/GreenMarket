export const readStoredJson = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

export const writeStoredJson = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(key, JSON.stringify(value));
};

export const removeStoredJson = (key: string) => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(key);
};
