import { Response } from "express";
import { AuthRequest } from "../../dtos/auth.ts";
import { adminConfigStoreService } from "../../services/adminConfigStore.service.ts";

const TEMPLATE_BUILDER_PRESET_KEY = "admin_template_builder_preset";

type TemplateBuilderPreset = {
  selectedTemplateId: number | null;
  selectedTypeFilter: "All" | "Rejection Reason" | "Report Reason" | "Notification";
  channel: "Email" | "In-App Notification" | "Moderation Note";
  audience: "Seller" | "Reporter" | "Internal Admin";
  tone: "Formal" | "Supportive" | "Direct";
  shopName: string;
  postTitle: string;
  reason: string;
  slotName: string;
  contactEmail: string;
  adminNote: string;
};

const defaultPreset: TemplateBuilderPreset = {
  selectedTemplateId: null,
  selectedTypeFilter: "All",
  channel: "Email",
  audience: "Seller",
  tone: "Supportive",
  shopName: "Green Corner Garden",
  postTitle: "Rare Monstera Deliciosa for Sale",
  reason: "Listing is missing mandatory details.",
  slotName: "Home Top",
  contactEmail: "ops@greenmarket.com",
  adminNote: "Update the content and resubmit within 24 hours.",
};

const normalizePreset = (
  payload: Partial<TemplateBuilderPreset>,
): TemplateBuilderPreset => ({
  ...defaultPreset,
  ...payload,
});

export const getTemplateBuilderPreset = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const preset = await adminConfigStoreService.getJson<TemplateBuilderPreset>(
      TEMPLATE_BUILDER_PRESET_KEY,
      defaultPreset,
    );

    res.json(normalizePreset(preset));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const saveTemplateBuilderPreset = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const preset = normalizePreset(req.body as Partial<TemplateBuilderPreset>);
    const savedPreset = await adminConfigStoreService.setJson(
      TEMPLATE_BUILDER_PRESET_KEY,
      preset,
      req.user?.id,
    );

    res.json(savedPreset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resetTemplateBuilderPreset = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const savedPreset = await adminConfigStoreService.setJson(
      TEMPLATE_BUILDER_PRESET_KEY,
      defaultPreset,
      req.user?.id,
    );

    res.json(savedPreset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
