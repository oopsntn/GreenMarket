import type { Template, TemplateFormState } from "../types/template";

export const initialTemplates: Template[] = [
  {
    id: 1,
    name: "Post Rejection - Invalid Content",
    type: "Rejection Reason",
    content: "Your post violates our marketplace content policy.",
    status: "Active",
    updatedAt: "2026-03-14",
  },
  {
    id: 2,
    name: "Post Rejection - Missing Information",
    type: "Rejection Reason",
    content:
      "Your post is missing required information and cannot be approved.",
    status: "Active",
    updatedAt: "2026-03-13",
  },
  {
    id: 3,
    name: "Report Reason - Spam Content",
    type: "Report Reason",
    content: "This content appears to be spam or misleading.",
    status: "Active",
    updatedAt: "2026-03-12",
  },
  {
    id: 4,
    name: "Notification - Account Locked",
    type: "Notification",
    content: "Your account has been locked due to suspicious activity.",
    status: "Disabled",
    updatedAt: "2026-03-11",
  },
];

export const emptyTemplateForm: TemplateFormState = {
  name: "",
  type: "Rejection Reason",
  content: "",
  status: "Active",
};
