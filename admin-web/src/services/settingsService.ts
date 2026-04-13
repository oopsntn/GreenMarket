import { apiClient } from "../lib/apiClient";
import type { SettingsState } from "../types/settings";

const SETTINGS_API_PATH = "/api/admin/settings";

export const settingsService = {
  getSettings(): Promise<SettingsState> {
    return apiClient.request<SettingsState>(SETTINGS_API_PATH, {
      defaultErrorMessage: "Không thể tải thiết lập hệ thống.",
    });
  },

  updateSettings(currentSettings: SettingsState): Promise<SettingsState> {
    return apiClient.request<SettingsState>(SETTINGS_API_PATH, {
      method: "PUT",
      includeJsonContentType: true,
      defaultErrorMessage: "Không thể lưu thiết lập hệ thống.",
      body: JSON.stringify(currentSettings),
    });
  },

  resetSettings(): Promise<SettingsState> {
    return apiClient.request<SettingsState>(`${SETTINGS_API_PATH}/reset`, {
      method: "POST",
      defaultErrorMessage: "Không thể khôi phục thiết lập mặc định.",
    });
  },
};
