import { Response } from "express";
import { AuthRequest } from "../../dtos/auth.ts";
import { adminConfigStoreService } from "../../services/adminConfigStore.service.ts";

const SETTINGS_KEY = "admin_web_settings";

type SettingsState = {
  general: {
    platformName: string;
    supportEmail: string;
    defaultLanguage: string;
  };
  moderation: {
    autoModeration: boolean;
    bannedKeywordFilter: boolean;
    reportLimit: number;
  };
  postLifecycle: {
    postExpiryDays: number;
    restoreWindowDays: number;
    allowAutoExpire: boolean;
  };
  media: {
    maxImagesPerPost: number;
    maxFileSizeMb: number;
    enableImageCompression: boolean;
  };
};

const defaultSettings: SettingsState = {
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

const normalizeSettings = (payload: Partial<SettingsState>): SettingsState => ({
  general: {
    ...defaultSettings.general,
    ...payload.general,
  },
  moderation: {
    ...defaultSettings.moderation,
    ...payload.moderation,
  },
  postLifecycle: {
    ...defaultSettings.postLifecycle,
    ...payload.postLifecycle,
  },
  media: {
    ...defaultSettings.media,
    ...payload.media,
  },
});

export const getSettings = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const settings = await adminConfigStoreService.getJson<SettingsState>(
      SETTINGS_KEY,
      defaultSettings,
    );

    res.json(normalizeSettings(settings));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const nextSettings = normalizeSettings(req.body as Partial<SettingsState>);
    const savedSettings = await adminConfigStoreService.setJson(
      SETTINGS_KEY,
      nextSettings,
      req.user?.id,
    );

    res.json(savedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resetSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const savedSettings = await adminConfigStoreService.setJson(
      SETTINGS_KEY,
      defaultSettings,
      req.user?.id,
    );

    res.json(savedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
