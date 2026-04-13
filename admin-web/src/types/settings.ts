export type SupportedLanguage = "Tiếng Việt";

export type GeneralSettings = {
  platformName: string;
  supportEmail: string;
  defaultLanguage: SupportedLanguage;
  otpSandboxEnabled: boolean;
};

export type ModerationSettings = {
  autoModeration: boolean;
  bannedKeywordFilter: boolean;
  bannedKeywords: string[];
  reportLimit: number;
};

export type PostLifecycleSettings = {
  postExpiryDays: number;
  restoreWindowDays: number;
  allowAutoExpire: boolean;
  postRateLimitPerHour: number;
};

export type MediaSettings = {
  maxImagesPerPost: number;
  maxFileSizeMb: number;
  enableImageCompression: boolean;
};

export type SettingsState = {
  general: GeneralSettings;
  moderation: ModerationSettings;
  postLifecycle: PostLifecycleSettings;
  media: MediaSettings;
};
