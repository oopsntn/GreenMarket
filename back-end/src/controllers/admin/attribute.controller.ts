import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { attributes, type NewAttribute } from "../../models/schema/attributes";
import { parseId } from "../../utils/parseId";

export const getAttributes = async (req: Request, res: Response): Promise<void> => {
    try {
        const allAttributes = await db.select().from(attributes);
        res.json(allAttributes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createAttribute = async (req: Request<{}, {}, NewAttribute>, res: Response): Promise<void> => {
    try {
        const [newAttribute] = await db.insert(attributes).values(req.body).returning();
        res.status(201).json(newAttribute);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateAttribute = async (req: Request<{ id: string }, {}, Partial<NewAttribute>>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid attribute id" });
            return;
        }

        const [updatedAttribute] = await db
            .update(attributes)
            .set(req.body)
            .where(eq(attributes.attributeId, idNumber))
            .returning();

        if (!updatedAttribute) {
            res.status(404).json({ error: "Attribute not found" });
            return;
        }

        res.json(updatedAttribute);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteAttribute = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid attribute id" });
            return;
        }

        const [deletedAttribute] = await db.delete(attributes).where(eq(attributes.attributeId, idNumber)).returning();

        if (!deletedAttribute) {
            res.status(404).json({ error: "Attribute not found" });
            return;
        }

        res.json({ message: "Attribute deleted successfully", deletedAttribute });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
