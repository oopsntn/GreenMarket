import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq } from "drizzle-orm";
import { users } from "../../models/schema/users.ts";
import { parseId } from "../../utils/parseId.ts";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const allUsers = await db.select().from(users);
        res.json(allUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getUserById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid user id" });
            return;
        }

        const [user] = await db.select().from(users).where(eq(users.userId, idNumber)).limit(1);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUserStatus = async (req: Request<{ id: string }, {}, { status: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid user id" });
            return;
        }

        const { status } = req.body; // active, blocked

        const [updatedUser] = await db.update(users)
            .set({ 
                userStatus: status,
                userUpdatedAt: new Date()
            })
            .where(eq(users.userId, idNumber))
            .returning();

        if (!updatedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
