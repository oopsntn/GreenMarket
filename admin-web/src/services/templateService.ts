import { initialTemplates } from "../mock-data/templates";
import type {
  Template,
  TemplateFormState,
  TemplateStatus,
} from "../types/template";
import { readStoredJson, writeStoredJson } from "../utils/browserStorage";

const TEMPLATE_STORAGE_KEY = "adminTemplateLibrary";
const TEMPLATE_UPDATED_AT = "2026-04-04";

const getStoredTemplates = () =>
  readStoredJson<Template[]>(TEMPLATE_STORAGE_KEY, initialTemplates);

const saveTemplates = (templates: Template[]) => {
  writeStoredJson(TEMPLATE_STORAGE_KEY, templates);
  return templates;
};

const normalizeTemplateName = (value: string) => value.trim().toLowerCase();

export const templateService = {
  validateTemplateForm(
    templates: Template[],
    formData: TemplateFormState,
    selectedTemplateId?: number | null,
  ) {
    if (!formData.name.trim()) {
      throw new Error("Template name is required.");
    }

    if (!formData.content.trim()) {
      throw new Error("Template content is required.");
    }

    const hasDuplicate = templates.some((template) => {
      if (selectedTemplateId && template.id === selectedTemplateId) {
        return false;
      }

      return (
        normalizeTemplateName(template.name) ===
          normalizeTemplateName(formData.name) && template.type === formData.type
      );
    });

    if (hasDuplicate) {
      throw new Error("A template with the same name and type already exists.");
    }
  },

  getTemplates(): Template[] {
    return getStoredTemplates();
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
      updatedAt: TEMPLATE_UPDATED_AT,
    };

    return saveTemplates([newTemplate, ...templates]);
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
            updatedAt: TEMPLATE_UPDATED_AT,
          }
        : template,
    );

    return saveTemplates(updatedTemplates);
  },

  updateTemplateStatus(
    templates: Template[],
    templateId: number,
    status: TemplateStatus,
  ): Template[] {
    const updatedTemplates = templates.map((template) =>
      template.id === templateId ? { ...template, status } : template,
    );

    return saveTemplates(updatedTemplates);
  },
};
