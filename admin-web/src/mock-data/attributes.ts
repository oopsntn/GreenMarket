import type { Attribute, AttributeFormState } from "../types/attribute";

export const initialAttributes: Attribute[] = [
  {
    id: 1,
    name: "Height",
    code: "height",
    type: "Number",
    usedIn: ["Indoor Plants", "Outdoor Plants"],
    status: "Active",
    createdAt: "2026-03-10",
    options: [],
  },
  {
    id: 2,
    name: "Pot Size",
    code: "pot-size",
    type: "Text",
    usedIn: ["Indoor Plants", "Succulents"],
    status: "Active",
    createdAt: "2026-03-10",
    options: [],
  },
  {
    id: 3,
    name: "Sunlight Level",
    code: "sunlight-level",
    type: "Select",
    usedIn: ["Outdoor Plants", "Bonsai"],
    status: "Active",
    createdAt: "2026-03-11",
    options: ["Low", "Medium", "High"],
  },
  {
    id: 4,
    name: "Pet Friendly",
    code: "pet-friendly",
    type: "Boolean",
    usedIn: ["Indoor Plants"],
    status: "Active",
    createdAt: "2026-03-11",
    options: [],
  },
  {
    id: 5,
    name: "Watering Frequency",
    code: "watering-frequency",
    type: "Select",
    usedIn: ["Indoor Plants", "Outdoor Plants", "Succulents"],
    status: "Disabled",
    createdAt: "2026-03-12",
    options: ["Daily", "Every 2 days", "Weekly"],
  },
];

export const emptyAttributeForm: AttributeFormState = {
  name: "",
  code: "",
  type: "Text",
  optionsText: "",
};
