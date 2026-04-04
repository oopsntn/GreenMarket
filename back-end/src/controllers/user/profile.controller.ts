import { Response } from "express";
import { db } from "../../config/db.ts";
import { eq } from "drizzle-orm";
import { users } from "../../models/schema/users.ts";
import { AuthRequest } from "../../dtos/auth";

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
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

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { userDisplayName, userAvatarUrl, userEmail } = req.body;

        const [updatedUser] = await db.update(users)
            .set({ 
                userDisplayName: userDisplayName,
                userAvatarUrl: userAvatarUrl,
                userEmail: userEmail,
                userUpdatedAt: new Date()
            })
            .where(eq(users.userId, userId))
            .returning();

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
