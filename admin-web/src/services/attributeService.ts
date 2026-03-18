import { initialAttributes } from "../mock-data/attributes";
import type {
  Attribute,
  AttributeFormState,
  AttributeStatus,
} from "../types/attribute";

export const attributeService = {
  getAttributes(): Attribute[] {
    return initialAttributes;
  },

  createAttribute(
    attributes: Attribute[],
    formData: AttributeFormState,
  ): Attribute[] {
    const newAttribute: Attribute = {
      id: attributes.length + 1,
      name: formData.name,
      code: formData.code,
      type: formData.type,
      required: formData.required,
      status: formData.status,
      createdAt: "2026-03-18",
    };

    return [newAttribute, ...attributes];
  },

  updateAttribute(
    attributes: Attribute[],
    selectedAttributeId: number,
    formData: AttributeFormState,
  ): Attribute[] {
    return attributes.map((attribute) =>
      attribute.id === selectedAttributeId
        ? {
            ...attribute,
            name: formData.name,
            code: formData.code,
            type: formData.type,
            required: formData.required,
            status: formData.status,
          }
        : attribute,
    );
  },

  updateAttributeStatus(
    attributes: Attribute[],
    attributeId: number,
    status: AttributeStatus,
  ): Attribute[] {
    return attributes.map((attribute) =>
      attribute.id === attributeId ? { ...attribute, status } : attribute,
    );
  },
};
