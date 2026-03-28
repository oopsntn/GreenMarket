import { initialTemplates } from "../mock-data/templates";
import type {
  Template,
  TemplateFormState,
  TemplateStatus,
} from "../types/template";

export const templateService = {
  getTemplates(): Template[] {
    return initialTemplates;
  },

  createTemplate(
    templates: Template[],
    formData: TemplateFormState,
  ): Template[] {
    const newTemplate: Template = {
      id: templates.length + 1,
      name: formData.name,
      type: formData.type,
      content: formData.content,
      status: formData.status,
      updatedAt: "2026-03-18",
    };

    return [newTemplate, ...templates];
  },

  updateTemplate(
    templates: Template[],
    selectedTemplateId: number,
    formData: TemplateFormState,
  ): Template[] {
    return templates.map((template) =>
      template.id === selectedTemplateId
        ? {
            ...template,
            name: formData.name,
            type: formData.type,
            content: formData.content,
            status: formData.status,
            updatedAt: "2026-03-18",
          }
        : template,
    );
  },

  updateTemplateStatus(
    templates: Template[],
    templateId: number,
    status: TemplateStatus,
  ): Template[] {
    return templates.map((template) =>
      template.id === templateId ? { ...template, status } : template,
    );
  },
};
