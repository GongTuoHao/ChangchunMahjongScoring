export type AppMode = "record" | "calculator";

export interface AppSettings {
  readonly mode: AppMode;
}

const APP_SETTINGS_STORAGE_KEY = "changchun-mahjong-settings";

const DEFAULT_SETTINGS: AppSettings = {
  mode: "record",
};

export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const rawValue = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    if (!rawValue) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(rawValue) as Partial<AppSettings>;
    if (parsed.mode === "record" || parsed.mode === "calculator") {
      return {
        mode: parsed.mode,
      };
    }
  } catch {
    return DEFAULT_SETTINGS;
  }

  return DEFAULT_SETTINGS;
}

export function persistAppSettings(settings: AppSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
