import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq } from "drizzle-orm";
import { shops, type NewShop } from "../../models/schema/shops.ts";
import { posts } from "../../models/schema/posts.ts";
import { parseId } from "../../utils/parseId.ts";

export const getShops = async (req: Request, res: Response): Promise<void> => {
    try {
        const allShops = await db.select().from(shops);
        res.json(allShops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createShop = async (req: Request<{}, {}, NewShop>, res: Response): Promise<void> => {
    try {
        const shopData = req.body;
        const [newShop] = await db.insert(shops).values(shopData).returning();
        res.status(201).json(newShop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getShopById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid shop id" });
            return;
        }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, idNumber)).limit(1);
        if (!shop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        res.json(shop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateShopStatus = async (req: Request<{ id: string }, {}, { status: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid shop id" });
            return;
        }

        const { status } = req.body;
        const [updatedShop] = await db.update(shops)
            .set({ shopStatus: status, shopUpdatedAt: new Date() })
            .where(eq(shops.shopId, idNumber))
            .returning();

        if (!updatedShop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        // Auto-assign all the owner's posts to this shop if status is changed to active
        let postsAssigned = 0;
        if (status === "active") {
            const { rowCount } = await db.update(posts)
                .set({ postShopId: updatedShop.shopId, postUpdatedAt: new Date() })
                .where(eq(posts.postAuthorId, updatedShop.shopOwnerId));
            postsAssigned = rowCount ?? 0;
        }

        res.json({
            ...updatedShop,
            postsAssigned
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteShop = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid shop id" });
            return;
        }

        const [deletedShop] = await db.delete(shops).where(eq(shops.shopId, idNumber)).returning();
        if (!deletedShop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        res.json({ message: "Shop deleted successfully", deletedShop });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const verifyShop = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid shop id" });
            return;
        }

        const [updatedShop] = await db.update(shops)
            .set({ shopStatus: "active", shopUpdatedAt: new Date() })
            .where(eq(shops.shopId, idNumber))
            .returning();

        if (!updatedShop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        // Auto-assign all the owner's posts to this shop
        const { rowCount } = await db.update(posts)
            .set({ postShopId: updatedShop.shopId, postUpdatedAt: new Date() })
            .where(eq(posts.postAuthorId, updatedShop.shopOwnerId));

        res.json({ 
            message: "Shop verified successfully", 
            shop: updatedShop,
            postsAssigned: rowCount ?? 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
