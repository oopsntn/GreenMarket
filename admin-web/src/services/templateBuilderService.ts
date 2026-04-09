import { apiClient } from "../lib/apiClient";
import type { TemplateBuilderPreset } from "../types/template";

const TEMPLATE_BUILDER_API_PATH = "/api/admin/template-builder/preset";

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
  getPreset(): Promise<TemplateBuilderPreset> {
    return apiClient.request<TemplateBuilderPreset>(TEMPLATE_BUILDER_API_PATH, {
      defaultErrorMessage: "Unable to load template builder preset.",
    });
  },

  savePreset(preset: TemplateBuilderPreset): Promise<TemplateBuilderPreset> {
    return apiClient.request<TemplateBuilderPreset>(TEMPLATE_BUILDER_API_PATH, {
      method: "PUT",
      includeJsonContentType: true,
      defaultErrorMessage: "Unable to save template builder preset.",
      body: JSON.stringify(preset),
    });
  },

  resetPreset(): Promise<TemplateBuilderPreset> {
    return apiClient.request<TemplateBuilderPreset>(
      `${TEMPLATE_BUILDER_API_PATH}/reset`,
      {
        method: "POST",
        defaultErrorMessage: "Unable to reset template builder preset.",
      },
    );
  },

  getDefaultPreset() {
    return { ...defaultPreset };
  },
};
