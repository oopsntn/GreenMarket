import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq } from "drizzle-orm";
import { shops, type Shop } from "../../models/schema/shops.ts";

// Note: In a real app, userId would come from authentication middleware (req.user)
// For this stage, we'll expect it in the body or use a test ID
export const registerShop = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, shopName, shopPhone, shopLocation, shopDescription } = req.body;

        if (!userId || !shopName) {
            res.status(400).json({ error: "User ID and Shop Name are required" });
            return;
        }

        // Check if user already has a shop
        const [existingShop] = await db.select().from(shops).where(eq(shops.shopOwnerId, userId)).limit(1);
        if (existingShop) {
            res.status(400).json({ error: "User already has a shop registered" });
            return;
        }

        const [newShop] = await db.insert(shops).values({
            shopOwnerId: userId,
            shopName,
            shopPhone,
            shopLocation,
            shopDescription,
            shopStatus: "pending"
        }).returning();

        res.status(201).json(newShop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMyShop = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.query; // Expecting userId for now since auth isn't fully integrated here
        
        if (!userId) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }

        const [myShop] = await db.select().from(shops).where(eq(shops.shopOwnerId, Number(userId))).limit(1);
        if (!myShop) {
            res.status(404).json({ error: "Shop not found for this user" });
            return;
        }

        res.json(myShop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
