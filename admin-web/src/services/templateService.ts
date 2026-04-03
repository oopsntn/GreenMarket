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

export const templateService = {
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
