import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq, and, inArray, sql } from "drizzle-orm";
import { shops, type Shop } from "../../models/schema/shops.ts";
import { posts, postImages } from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import { verificationService } from "../../services/verification.service.ts";
import { users } from "../../models/schema/users.ts";

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


const validateEmail = (email: string) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

export const registerShop = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { 
            shopName, shopEmail, shopPhone, shopLocation, shopDescription, 
            shopLat, shopLng, shopLogoUrl, shopCoverUrl, shopGalleryImages,
            shopFacebook, shopInstagram, shopYoutube
        } = req.body;

        if (!shopName) {
            res.status(400).json({ error: "Shop Name is required" });
            return;
        }

        if (shopEmail && !validateEmail(shopEmail)) {
            res.status(400).json({ error: "Invalid Shop Email address" });
            return;
        }

        // Check if user already has a shop
        const [existingShopById] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (existingShopById) {
            res.status(400).json({ error: "User already has a shop registered" });
            return;
        }

        // Check if email is already taken
        if (shopEmail) {
            const [existingShopByEmail] = await db.select().from(shops).where(eq(shops.shopEmail, shopEmail)).limit(1);
            if (existingShopByEmail) {
                res.status(400).json({ error: "Shop Email is already in use by another shop" });
                return;
            }
        }

        const galleryCover = serializeShopGalleryImages(shopGalleryImages);

        // Fetch user's registered phone number to use as default shopPhone if not provided
        let defaultShopPhone = shopPhone;
        if (!defaultShopPhone) {
            const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
            defaultShopPhone = user?.userMobile || null;
        }

        const [newShop] = await db.insert(shops).values({
            shopId: userId,
            shopName,
            shopEmail,
            shopEmailVerified: false,
            shopPhone: defaultShopPhone,
            shopFacebook,
            shopInstagram,
            shopYoutube,
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

        const [myShop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
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
        if (existingShop.shopId !== userId) {
            res.status(403).json({ error: "Unauthorized to update this shop" });
            return;
        }

        const { 
            shopName, shopEmail, shopLocation, shopDescription, 
            shopLat, shopLng, shopLogoUrl, shopCoverUrl, shopGalleryImages,
            shopFacebook, shopInstagram, shopYoutube
        } = req.body;

        if (shopEmail && !validateEmail(shopEmail)) {
            res.status(400).json({ error: "Invalid Shop Email address" });
            return;
        }

        let updatedEmailVerified = existingShop.shopEmailVerified;

        // Check if new email is already taken by another shop
        if (shopEmail && shopEmail !== existingShop.shopEmail) {
            const [duplicateEmail] = await db.select().from(shops).where(eq(shops.shopEmail, shopEmail)).limit(1);
            if (duplicateEmail) {
                res.status(400).json({ error: "Shop Email is already in use by another shop" });
                return;
            }
            updatedEmailVerified = false; // Reset verification if email changes
        }

        const galleryCover = serializeShopGalleryImages(shopGalleryImages);

        const [updatedShop] = await db.update(shops)
            .set({
                shopName,
                shopEmail,
                shopEmailVerified: updatedEmailVerified,
                shopFacebook,
                shopInstagram,
                shopYoutube,
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

// --- Verification & Phone Management ---

export const requestVerificationOTP = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

        const { target, type } = req.body;
        if (!target || !type || !["email", "phone"].includes(type)) {
            res.status(400).json({ error: "Invalid target or type. Type must be 'email' or 'phone'." });
            return;
        }

        // Check for duplicates
        if (type === "phone") {
            // Check if phone exists (using Drizzle's ILIKE for Postgres)
            const duplicatePhones = await db.select().from(shops).where(sql`shop_phone ILIKE ${'%' + target + '%'}`);
            // Exact match validation in backend since ILIKE could match substrings
            const isDuplicate = duplicatePhones.some(s => s.shopPhone?.split('|').includes(target));
            if (isDuplicate) {
                res.status(400).json({ error: "Phone number is already in use by a shop" });
                return;
            }
        } else if (type === "email") {
            const [duplicateEmail] = await db.select().from(shops).where(eq(shops.shopEmail, target)).limit(1);
            if (duplicateEmail && duplicateEmail.shopId !== userId) {
                res.status(400).json({ error: "Email is already in use by another shop" });
                return;
            }
        }

        const expiresIn = type === "email" ? 15 : 5;
        const result = await verificationService.requestOTP(target, type as "email" | "phone", expiresIn);
        
        if (!result.success) {
            res.status(500).json({ error: result.message });
            return;
        }

        res.json({ message: result.message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const verifyShopEmail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

        const { email, otp } = req.body;
        if (!email || !otp) { res.status(400).json({ error: "Missing email or otp" }); return; }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (!shop || shop.shopEmail !== email) {
            res.status(400).json({ error: "Shop email does not match" });
            return;
        }

        const result = await verificationService.verifyOTP(email, otp, "email");
        if (!result.success) {
            res.status(400).json({ error: result.message });
            return;
        }

        await db.update(shops).set({ shopEmailVerified: true }).where(eq(shops.shopId, userId));
        res.json({ message: "Email successfully verified!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const addShopPhone = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

        const { phone, otp } = req.body;
        if (!phone || !otp) { res.status(400).json({ error: "Missing phone or otp" }); return; }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }

        let currentPhones = shop.shopPhone ? shop.shopPhone.split('|') : [];
        if (currentPhones.length >= 3) {
            res.status(400).json({ error: "Maximum limit of 3 phone numbers reached." });
            return;
        }
        if (currentPhones.includes(phone)) {
            res.status(400).json({ error: "Phone number already exists in your shop." });
            return;
        }

        // Verify OTP
        const result = await verificationService.verifyOTP(phone, otp, "phone");
        if (!result.success) {
            res.status(400).json({ error: result.message });
            return;
        }

        currentPhones.push(phone);
        const newPhoneString = currentPhones.join('|');

        await db.update(shops).set({ shopPhone: newPhoneString }).where(eq(shops.shopId, userId));
        res.json({ message: "Phone number added successfully", shopPhone: newPhoneString });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteShopPhone = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

        const { phone } = req.body;
        if (!phone) { res.status(400).json({ error: "Missing phone number" }); return; }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }

        let currentPhones = shop.shopPhone ? shop.shopPhone.split('|') : [];
        if (currentPhones.length <= 1) {
            res.status(400).json({ error: "Cannot delete the only phone number." });
            return;
        }

        if (!currentPhones.includes(phone)) {
            res.status(400).json({ error: "Phone number not found in your shop." });
            return;
        }

        currentPhones = currentPhones.filter(p => p !== phone);
        const newPhoneString = currentPhones.join('|');

        await db.update(shops).set({ shopPhone: newPhoneString }).where(eq(shops.shopId, userId));

        // Send real Security Warning Email
        if (shop.shopEmail) {
            await verificationService.sendSecurityWarningEmail(shop.shopEmail, phone);
        }

        res.json({ message: "Phone number deleted successfully", shopPhone: newPhoneString });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
