import { Request, Response } from "express";
import { adminWebSettingsService } from "../../services/adminWebSettings.service.ts";

export const getPublicSystemSettings = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const settings = await adminWebSettingsService.getPublicSettings();
    res.json(settings);
  } catch (error) {
    console.error("Failed to load public system settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
