import type { SettingsState } from "../types/settings";

export const defaultSettings: SettingsState = {
  general: {
    platformName: "GreenMarket",
    supportEmail: "support@greenmarket.vn",
    defaultLanguage: "English",
  },
  moderation: {
    autoModeration: true,
    bannedKeywordFilter: true,
    reportLimit: 5,
  },
  postLifecycle: {
    postExpiryDays: 30,
    restoreWindowDays: 7,
    allowAutoExpire: true,
  },
  media: {
    maxImagesPerPost: 10,
    maxFileSizeMb: 5,
    enableImageCompression: true,
  },
};
