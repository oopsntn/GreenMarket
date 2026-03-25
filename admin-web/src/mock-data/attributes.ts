import type { Attribute, AttributeFormState } from "../types/attribute";

export const initialAttributes: Attribute[] = [
  {
    id: 1,
    name: "Height",
    code: "height",
    type: "Number",
    required: true,
    status: "Active",
    createdAt: "2026-03-10",
  },
  {
    id: 2,
    name: "Pot Size",
    code: "pot_size",
    type: "Text",
    required: false,
    status: "Active",
    createdAt: "2026-03-11",
  },
  {
    id: 3,
    name: "Light Requirement",
    code: "light_requirement",
    type: "Select",
    required: true,
    status: "Active",
    createdAt: "2026-03-12",
  },
  {
    id: 4,
    name: "Pet Friendly",
    code: "pet_friendly",
    type: "Boolean",
    required: false,
    status: "Disabled",
    createdAt: "2026-03-13",
  },
];

export const emptyAttributeForm: AttributeFormState = {
  name: "",
  code: "",
  type: "Text",
  required: false,
  status: "Active",
};
