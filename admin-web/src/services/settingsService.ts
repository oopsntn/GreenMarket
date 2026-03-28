import { defaultSettings } from "../mock-data/settings";
import type { SettingsState } from "../types/settings";

export const settingsService = {
  getSettings(): SettingsState {
    return defaultSettings;
  },

  updateSettings(currentSettings: SettingsState): SettingsState {
    return {
      ...currentSettings,
    };
  },
};
