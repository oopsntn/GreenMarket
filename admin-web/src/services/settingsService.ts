import { apiClient } from "../lib/apiClient";
import type { SettingsState } from "../types/settings";

const SETTINGS_API_PATH = "/api/admin/settings";

export const settingsService = {
  getSettings(): Promise<SettingsState> {
    return apiClient.request<SettingsState>(SETTINGS_API_PATH, {
      defaultErrorMessage: "Unable to load settings.",
    });
  },

  updateSettings(currentSettings: SettingsState): Promise<SettingsState> {
    return apiClient.request<SettingsState>(SETTINGS_API_PATH, {
      method: "PUT",
      includeJsonContentType: true,
      defaultErrorMessage: "Unable to save settings.",
      body: JSON.stringify(currentSettings),
    });
  },

  resetSettings(): Promise<SettingsState> {
    return apiClient.request<SettingsState>(`${SETTINGS_API_PATH}/reset`, {
      method: "POST",
      defaultErrorMessage: "Unable to reset settings.",
    });
  },
};
