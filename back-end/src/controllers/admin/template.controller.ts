import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import {
  adminTemplates,
  type NewAdminTemplate,
} from "../../models/schema/admin-templates.ts";
import { parseId } from "../../utils/parseId.ts";

export const getTemplates = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const templates = await db.select().from(adminTemplates);
    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createTemplate = async (
  req: Request<{}, {}, NewAdminTemplate>,
  res: Response,
): Promise<void> => {
  try {
    const payload: NewAdminTemplate = {
      ...req.body,
      templateStatus: req.body.templateStatus ?? "Active",
      templateUpdatedAt: new Date(),
    };

    const [newTemplate] = await db
      .insert(adminTemplates)
      .values(payload)
      .returning();

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTemplate = async (
  req: Request<{ id: string }, {}, Partial<NewAdminTemplate>>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);

    if (idNumber === null) {
      res.status(400).json({ error: "Invalid template id" });
      return;
    }

    const [updatedTemplate] = await db
      .update(adminTemplates)
      .set({
        ...req.body,
        templateUpdatedAt: new Date(),
      })
      .where(eq(adminTemplates.templateId, idNumber))
      .returning();

    if (!updatedTemplate) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    res.json(updatedTemplate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTemplateStatus = async (
  req: Request<{ id: string }, {}, { templateStatus?: string }>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);

    if (idNumber === null) {
      res.status(400).json({ error: "Invalid template id" });
      return;
    }

    const nextStatus = req.body.templateStatus;
    if (!nextStatus) {
      res.status(400).json({ error: "templateStatus is required" });
      return;
    }

    const [updatedTemplate] = await db
      .update(adminTemplates)
      .set({
        templateStatus: nextStatus,
        templateUpdatedAt: new Date(),
      })
      .where(eq(adminTemplates.templateId, idNumber))
      .returning();

    if (!updatedTemplate) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    res.json(updatedTemplate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
