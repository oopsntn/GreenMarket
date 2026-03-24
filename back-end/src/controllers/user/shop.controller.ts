import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq, and, inArray } from "drizzle-orm";
import { shops, type Shop } from "../../models/schema/shops.ts";
import { posts, postImages } from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";

// Note: In a real app, userId would come from authentication middleware (req.user)
// For this stage, we'll expect it in the body or use a test ID

export const registerShop = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, shopName, shopPhone, shopLocation, shopDescription, shopLat, shopLng } = req.body;

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
            shopLat: shopLat ? String(shopLat) : null,
            shopLng: shopLng ? String(shopLng) : null,
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

export const getPublicShopById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const id = parseId(req.params.id);
        if (!id) {
            res.status(400).json({ error: "Invalid Shop ID" });
            return;
        }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, id)).limit(1);
        if (!shop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        const shopPosts = await db.select()
            .from(posts)
            .where(and(eq(posts.postShopId, id), eq(posts.postStatus, "approved")));

        // Fetch images for these posts
        let postsWithImages = shopPosts.map(p => ({ ...p, images: [] as any[] }));
        if (shopPosts.length > 0) {
            const postIds = shopPosts.map(p => p.postId);
            const images = await db.select()
                .from(postImages)
                .where(inArray(postImages.postId, postIds));
            
            postsWithImages = shopPosts.map(post => ({
                ...post,
                images: images.filter(img => img.postId === post.postId)
            }));
        }

        res.json({
            ...shop,
            posts: postsWithImages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateShop = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseId(req.params.id as string);
        if (!id) {
            res.status(400).json({ error: "Invalid Shop ID" });
            return;
        }

        const { shopName, shopPhone, shopLocation, shopDescription, shopLat, shopLng } = req.body;

        const [updatedShop] = await db.update(shops)
            .set({ 
                shopName, 
                shopPhone, 
                shopLocation, 
                shopDescription, 
                shopLat: shopLat !== undefined ? String(shopLat) : undefined,
                shopLng: shopLng !== undefined ? String(shopLng) : undefined,
                shopUpdatedAt: new Date() 
            })
            .where(eq(shops.shopId, id))
            .returning();

        if (!updatedShop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        res.json(updatedShop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
