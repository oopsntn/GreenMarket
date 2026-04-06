import type { TemplateBuilderPreset } from "../types/template";
import { readStoredJson, writeStoredJson } from "../utils/browserStorage";

const TEMPLATE_BUILDER_PRESET_KEY = "adminTemplateBuilderPreset";

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

export const templateBuilderService = {
  getPreset(): TemplateBuilderPreset {
    return readStoredJson<TemplateBuilderPreset>(
      TEMPLATE_BUILDER_PRESET_KEY,
      defaultPreset,
    );
  },

  savePreset(preset: TemplateBuilderPreset) {
    writeStoredJson(TEMPLATE_BUILDER_PRESET_KEY, preset);
    return preset;
  },

  getDefaultPreset() {
    return { ...defaultPreset };
  },
};
