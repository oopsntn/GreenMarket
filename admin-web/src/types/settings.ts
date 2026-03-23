export type GeneralSettings = {
  platformName: string;
  supportEmail: string;
  defaultLanguage: string;
};

export type ModerationSettings = {
  autoModeration: boolean;
  bannedKeywordFilter: boolean;
  reportLimit: number;
};

export type PostLifecycleSettings = {
  postExpiryDays: number;
  restoreWindowDays: number;
  allowAutoExpire: boolean;
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
