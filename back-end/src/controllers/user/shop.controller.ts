import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq, and, inArray, sql } from "drizzle-orm";
import { shops, type Shop } from "../../models/schema/shops.ts";
import { posts, postImages } from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { AuthRequest } from "../../dtos/auth.ts";

const SHOP_GALLERY_DELIMITER = "|";

const parseShopGalleryImages = (rawCover: string | null | undefined): string[] => {
    if (!rawCover) return [];
    return rawCover
        .split(SHOP_GALLERY_DELIMITER)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
};

const serializeShopGalleryImages = (images: unknown): string | null => {
    if (!Array.isArray(images)) return null;
    const normalized = images
        .map((item) => String(item || "").trim())
        .filter((item) => item.length > 0)
        .slice(0, 4);

    if (normalized.length === 0) return null;
    return normalized.join(SHOP_GALLERY_DELIMITER);
};

const withShopGallery = <T extends { shopCoverUrl?: string | null }>(shop: T) => {
    const shopGalleryImages = parseShopGalleryImages(shop.shopCoverUrl);
    return {
        ...shop,
        shopGalleryImages,
        shopPreviewImageUrl: shopGalleryImages[0] || null,
    };
};


export const registerShop = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { shopName, shopPhone, shopLocation, shopDescription, shopLat, shopLng, shopLogoUrl, shopCoverUrl, shopGalleryImages } = req.body;

        if (!shopName) {
            res.status(400).json({ error: "Shop Name is required" });
            return;
        }

        // Check if user already has a shop
        const [existingShop] = await db.select().from(shops).where(eq(shops.shopOwnerId, userId)).limit(1);
        if (existingShop) {
            res.status(400).json({ error: "User already has a shop registered" });
            return;
        }

        const galleryCover = serializeShopGalleryImages(shopGalleryImages);

        const [newShop] = await db.insert(shops).values({
            shopOwnerId: userId,
            shopName,
            shopPhone,
            shopLocation,
            shopDescription,
            shopLogoUrl,
            shopCoverUrl: galleryCover ?? shopCoverUrl ?? null,
            shopLat: shopLat ? String(shopLat) : null,
            shopLng: shopLng ? String(shopLng) : null,
            shopStatus: "pending"
        }).returning();

        res.status(201).json(withShopGallery(newShop));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMyShop = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const [myShop] = await db.select().from(shops).where(eq(shops.shopOwnerId, userId)).limit(1);
        if (!myShop) {
            res.status(404).json({ error: "Shop not found for this user" });
            return;
        }

        res.json(withShopGallery(myShop));
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

        const decoratedShop = withShopGallery(shop);

        res.json({
            ...decoratedShop,
            posts: postsWithImages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateShop = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseId(req.params.id as string);
        if (!id) {
            res.status(400).json({ error: "Invalid Shop ID" });
            return;
        }

        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        // Verify ownership
        const [existingShop] = await db.select().from(shops).where(eq(shops.shopId, id)).limit(1);
        if (!existingShop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }
        if (existingShop.shopOwnerId !== userId) {
            res.status(403).json({ error: "Unauthorized to update this shop" });
            return;
        }

        const { shopName, shopPhone, shopLocation, shopDescription, shopLat, shopLng, shopLogoUrl, shopCoverUrl, shopGalleryImages } = req.body;

        const galleryCover = serializeShopGalleryImages(shopGalleryImages);

        const [updatedShop] = await db.update(shops)
            .set({ 
                shopName, 
                shopPhone, 
                shopLocation, 
                shopDescription, 
                shopLogoUrl,
                shopCoverUrl: galleryCover ?? shopCoverUrl,
                shopLat: shopLat !== undefined ? String(shopLat) : undefined,
                shopLng: shopLng !== undefined ? String(shopLng) : undefined,
                shopUpdatedAt: new Date() 
            })
            .where(eq(shops.shopId, id))
            .returning();

        res.json(withShopGallery(updatedShop));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// --- Public: Browse All Shops ---

export const getAllShops = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const data = await db.select()
            .from(shops)
            .where(eq(shops.shopStatus, "active"))
            .limit(limit)
            .offset(offset)
            .orderBy(sql`${shops.shopCreatedAt} DESC`);

        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(shops)
            .where(eq(shops.shopStatus, "active"));

        const totalItems = Number(countResult[0]?.count) || 0;

        res.json({
            data: data.map((shop) => withShopGallery(shop)),
            meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
