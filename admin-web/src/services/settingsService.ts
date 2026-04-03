import { defaultSettings } from "../mock-data/settings";
import type { SettingsState } from "../types/settings";
import { readStoredJson, writeStoredJson } from "../utils/browserStorage";

const SETTINGS_STORAGE_KEY = "adminSystemSettings";

export const settingsService = {
  getSettings(): SettingsState {
    return readStoredJson<SettingsState>(SETTINGS_STORAGE_KEY, defaultSettings);
  },

  updateSettings(currentSettings: SettingsState): SettingsState {
    const nextSettings = {
      ...currentSettings,
    };

    writeStoredJson(SETTINGS_STORAGE_KEY, nextSettings);
    return nextSettings;
  },

  getDefaultSettings(): SettingsState {
    return {
      ...defaultSettings,
      general: { ...defaultSettings.general },
      moderation: { ...defaultSettings.moderation },
      postLifecycle: { ...defaultSettings.postLifecycle },
      media: { ...defaultSettings.media },
    };
  },
};
