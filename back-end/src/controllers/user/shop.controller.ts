import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq, and, inArray, sql, or, ilike, desc } from "drizzle-orm";
import { shops, type Shop } from "../../models/schema/shops.ts";
import { posts, postImages, eventLogs, shopCollaborators } from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import { verificationService } from "../../services/verification.service.ts";
import { users } from "../../models/schema/users.ts";
import {
    OwnerDashboardError,
    ownerDashboardService,
} from "../../services/owner-dashboard.service.ts";
import { postLifecycleService } from "../../services/postLifecycle.service.ts";

const SHOP_GALLERY_DELIMITER = "|";
const SHOP_EVENT_VIEW = "shop_view";
const SHOP_EVENT_CONTACT_CLICK = "shop_contact_click";
const SHOP_VIEW_DEDUP_MS = 30_000;
const recentShopViewCache = new Map<string, number>();

const getViewerIp = (req: Request): string => {
    const forwardedFor = req.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
        return forwardedFor.split(",")[0].trim();
    }
    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
        return forwardedFor[0]?.trim() || "unknown_ip";
    }
    return req.ip || req.socket?.remoteAddress || "unknown_ip";
};

const shouldCountShopView = (shopId: number, viewerKey: string): boolean => {
    const now = Date.now();
    const dedupKey = `${shopId}:${viewerKey}`;
    const lastTrackedAt = recentShopViewCache.get(dedupKey);
    if (lastTrackedAt && now - lastTrackedAt < SHOP_VIEW_DEDUP_MS) {
        return false;
    }

    recentShopViewCache.set(dedupKey, now);

    if (recentShopViewCache.size > 5000) {
        for (const [key, trackedAt] of recentShopViewCache.entries()) {
            if (now - trackedAt >= SHOP_VIEW_DEDUP_MS) {
                recentShopViewCache.delete(key);
            }
        }
    }

    return true;
};

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

const isShopVipActive = (shop: { shopVipExpiresAt?: Date | null }): boolean => {
    return shop.shopVipExpiresAt instanceof Date && shop.shopVipExpiresAt > new Date();
};

const withShopGallery = <T extends { shopCoverUrl?: string | null; shopVipExpiresAt?: Date | null }>(shop: T) => {
    const shopGalleryImages = parseShopGalleryImages(shop.shopCoverUrl);
    return {
        ...shop,
        shopGalleryImages,
        shopPreviewImageUrl: shopGalleryImages[0] || null,
        shopIsVipActive: isShopVipActive(shop),
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

        // Validation
        const errors: string[] = [];
        if (!shopName?.trim()) errors.push("Shop Name is required");
        if (!shopLocation?.trim()) errors.push("Shop Location is required");
        if (!shopDescription?.trim()) errors.push("Shop Description is required");
        if (shopLat === undefined || shopLat === null || String(shopLat).trim() === "") errors.push("Shop Latitude is required");
        if (shopLng === undefined || shopLng === null || String(shopLng).trim() === "") errors.push("Shop Longitude is required");
        
        if (!shopLogoUrl?.trim()) {
            errors.push("Shop Avatar (Logo) is required");
        }

        const galleryArray = Array.isArray(shopGalleryImages) ? shopGalleryImages : [];
        if (galleryArray.length < 3) {
            errors.push("At least 3 detailed images (Gallery) are required");
        }

        if (errors.length > 0) {
            res.status(400).json({ error: errors.join(", ") });
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

        // Automatically upgrade user to HOST business role
        await db.update(users)
            .set({ userBusinessRoleId: 2 })
            .where(eq(users.userId, userId));

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

export const deletePendingShop = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const [existingShop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (!existingShop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        if (existingShop.shopStatus !== "pending") {
            res.status(400).json({ error: "Only pending shops can be deleted" });
            return;
        }

        await db.delete(shops).where(eq(shops.shopId, userId));
        res.json({ message: "Shop registration cancelled successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const getOwnerDashboard = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        await postLifecycleService.syncAutoExpiredPosts();
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
            return;
        }

        const data = await ownerDashboardService.getByOwnerId(userId);
        res.json(data);
    } catch (error) {
        if (error instanceof OwnerDashboardError) {
            res.status(error.statusCode).json({
                error: error.message,
                code: error.code,
                ...(error.details || {}),
            });
            return;
        }

        console.error(error);
        res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
};

export const getPublicShopById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await postLifecycleService.syncAutoExpiredPosts();
        const id = parseId(req.params.id as string);
        if (!id) {
            res.status(400).json({ error: "Invalid Shop ID" });
            return;
        }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, id)).limit(1);
        if (!shop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        const viewerId = req.user?.id;
        const isOwnerViewingOwnShop = viewerId === id;
        if (!isOwnerViewingOwnShop) {
            const viewerKey = viewerId
                ? `user:${viewerId}`
                : `ip:${getViewerIp(req)}`;

            if (shouldCountShopView(id, viewerKey)) {
                db.insert(eventLogs)
                    .values({
                        eventLogShopId: id,
                        eventLogUserId: viewerId ?? null,
                        eventLogEventType: SHOP_EVENT_VIEW,
                        eventLogMeta: { source: "shop_detail_page" },
                    })
                    .execute()
                    .catch((error) => console.error("Failed to track shop view:", error));
            }
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

export const recordShopContactClick = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const shopId = parseId(req.params.id as string);
        if (!shopId) {
            res.status(400).json({ error: "Shop ID is required" });
            return;
        }

        const [shop] = await db
            .select({ shopId: shops.shopId })
            .from(shops)
            .where(eq(shops.shopId, shopId))
            .limit(1);

        if (!shop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        await db.insert(eventLogs).values({
            eventLogShopId: shopId,
            eventLogEventType: SHOP_EVENT_CONTACT_CLICK,
            eventLogMeta: { source: "shop_contact_action" },
        });

        res.json({ success: true });
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
        await postLifecycleService.syncAutoExpiredPosts();
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const now = new Date();

        const data = await db.select()
            .from(shops)
            .where(eq(shops.shopStatus, "active"))
            .limit(limit)
            .offset(offset)
            .orderBy(
                sql`CASE WHEN ${shops.shopVipExpiresAt} IS NOT NULL AND ${shops.shopVipExpiresAt} > ${now} THEN 0 ELSE 1 END`,
                sql`${shops.shopCreatedAt} DESC`,
            );

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
        if (!shop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        // Verify OTP for the provided email (could be a new one)
        const result = await verificationService.verifyOTP(email, otp, "email");
        if (!result.success) {
            res.status(400).json({ error: result.message });
            return;
        }

        // Successfully verified. Update the shop's email to this verified one.
        await db.update(shops)
            .set({ 
                shopEmail: email,
                shopEmailVerified: true 
            })
            .where(eq(shops.shopId, userId));

        res.json({ message: "Email successfully verified and updated!", shopEmail: email });
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

/**
 * PATCH /api/shops/phones/primary
 * Đổi số điện thoại chính (phones[0]) sang một số đã có trong danh sách.
 * Xác thực qua email OTP của shop để đảm bảo an toàn.
 * Sau khi xác thực, cập nhật cả shops.shopPhone (reorder) và users.userMobile
 * để số mới trở thành SĐT đăng nhập OTP.
 */
export const setPrimaryPhone = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

        const { phone, emailOtp } = req.body;
        if (!phone || !emailOtp) {
            res.status(400).json({ error: "Missing phone or emailOtp" });
            return;
        }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }

        if (!shop.shopEmail || !shop.shopEmailVerified) {
            res.status(400).json({ error: "Bạn phải xác thực email cửa hàng trước khi đổi số điện thoại chính." });
            return;
        }

        let currentPhones = shop.shopPhone ? shop.shopPhone.split('|') : [];
        if (!currentPhones.includes(phone)) {
            res.status(400).json({ error: "Số điện thoại không nằm trong danh sách của cửa hàng." });
            return;
        }
        if (currentPhones[0] === phone) {
            res.status(400).json({ error: "Số điện thoại này đã là số chính." });
            return;
        }

        // Verify email OTP to confirm owner identity
        const result = await verificationService.verifyOTP(shop.shopEmail, emailOtp, "email");
        if (!result.success) {
            res.status(400).json({ error: result.message });
            return;
        }

        // Reorder: bring chosen phone to front, keep rest in order
        const reordered = [phone, ...currentPhones.filter(p => p !== phone)];
        const newPhoneString = reordered.join('|');

        // Update shop phone list
        await db.update(shops).set({ shopPhone: newPhoneString }).where(eq(shops.shopId, userId));

        // Update users.userMobile so OTP login works with new primary phone
        await db.update(users).set({ userMobile: phone, userUpdatedAt: new Date() }).where(eq(users.userId, userId));

        // Send security warning to shop email
        if (shop.shopEmail) {
            await verificationService.sendSecurityWarningEmail(shop.shopEmail, `Số điện thoại chính đã được đổi thành ${phone}`);
        }

        res.json({ message: "Đã đổi số điện thoại chính thành công", shopPhone: newPhoneString, primaryPhone: phone });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// --- Collaborator Management (Invitations) ---

/**
 * Send an invitation to a user to become a collaborator for the shop.
 */
export const inviteCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { userIdentifier } = req.body; // mobile or email

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (!userIdentifier) {
            res.status(400).json({ error: "User identifier (mobile or email) is required" });
            return;
        }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (!shop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        const inputId = parseId(userIdentifier);
        const searchConditions = [
            eq(users.userMobile, userIdentifier),
            eq(users.userEmail, userIdentifier)
        ];
        if (inputId) searchConditions.push(eq(users.userId, inputId));

        const [targetUser] = await db
            .select()
            .from(users)
            .where(or(...searchConditions))
            .limit(1);

        if (!targetUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        if (targetUser.userBusinessRoleId !== 3) {
            res.status(400).json({ error: "User must be registered as a Collaborator by Admin first" });
            return;
        }

        const [existing] = await db
            .select()
            .from(shopCollaborators)
            .where(
                and(
                    eq(shopCollaborators.shopCollaboratorsShopId, shop.shopId),
                    eq(shopCollaborators.collaboratorId, targetUser.userId)
                )
            )
            .limit(1);

        if (existing) {
            res.status(400).json({ 
                error: `User is already ${existing.shopCollaboratorsStatus === 'active' ? 'a collaborator' : 'invited'} for this shop` 
            });
            return;
        }

        await db.insert(shopCollaborators).values({
            shopCollaboratorsShopId: shop.shopId,
            collaboratorId: targetUser.userId,
            shopCollaboratorsStatus: "pending",
        });

        res.status(201).json({ message: "Invitation sent successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Remove a collaborator or cancel a pending invitation.
 */
export const removeCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const collId = parseId(req.params.id as string);
        if (!collId) {
            res.status(400).json({ error: "Invalid collaborator ID" });
            return;
        }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (!shop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        await db
            .delete(shopCollaborators)
            .where(
                and(
                    eq(shopCollaborators.shopCollaboratorsShopId, shop.shopId),
                    eq(shopCollaborators.collaboratorId, collId)
                )
            );

        res.json({ message: "Collaborator or invitation removed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get the list of collaborators and pending invites for the shop.
 */
export const getShopCollaborators = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (!shop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        const collaborators = await db
            .select({
                userId: users.userId,
                displayName: users.userDisplayName,
                mobile: users.userMobile,
                avatarUrl: users.userAvatarUrl,
                relationshipStatus: shopCollaborators.shopCollaboratorsStatus,
                joinedAt: shopCollaborators.shopCollaboratorsCreatedAt,
            })
            .from(shopCollaborators)
            .innerJoin(users, eq(shopCollaborators.collaboratorId, users.userId))
            .where(eq(shopCollaborators.shopCollaboratorsShopId, shop.shopId))
            .orderBy(desc(shopCollaborators.shopCollaboratorsCreatedAt));

        res.json(collaborators);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// --- Collaborator Post Approval ---

export const getPendingOwnerPosts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (!shop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        const pendingPosts = await db
            .select({
                postId: posts.postId,
                postTitle: posts.postTitle,
                postSlug: posts.postSlug,
                postStatus: posts.postStatus,
                postCreatedAt: posts.postCreatedAt,
                authorName: users.userDisplayName,
                authorMobile: users.userMobile,
            })
            .from(posts)
            .innerJoin(users, eq(posts.postAuthorId, users.userId))
            .where(and(eq(posts.postShopId, shop.shopId), eq(posts.postStatus, "pending_owner")))
            .orderBy(desc(posts.postCreatedAt));

        res.json(pendingPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const approveCollaboratorPost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const postId = parseId(req.params.id as string);
        if (!postId) {
            res.status(400).json({ error: "Invalid post ID" });
            return;
        }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (!shop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        // Verify post belongs to this shop and is pending_owner
        const [post] = await db
            .select()
            .from(posts)
            .where(and(eq(posts.postId, postId), eq(posts.postShopId, shop.shopId)))
            .limit(1);

        if (!post) {
            res.status(404).json({ error: "Post not found for this shop" });
            return;
        }

        if (post.postStatus !== "pending_owner") {
            res.status(400).json({ error: "Only posts waiting for owner approval can be approved here" });
            return;
        }

        await db
            .update(posts)
            .set({
                postStatus: "approved",
                postPublished: true,
                postPublishedAt: new Date(),
                postModeratedAt: new Date(),
            })
            .where(eq(posts.postId, postId));

        res.json({ message: "Post approved and published successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const rejectCollaboratorPost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const postId = parseId(req.params.id as string);
        if (!postId) {
            res.status(400).json({ error: "Invalid post ID" });
            return;
        }

        const { reason } = req.body;
        if (!reason) {
            res.status(400).json({ error: "Reason is required for rejection" });
            return;
        }

        const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
        if (!shop) {
            res.status(404).json({ error: "Shop not found" });
            return;
        }

        const [post] = await db
            .select()
            .from(posts)
            .where(and(eq(posts.postId, postId), eq(posts.postShopId, shop.shopId)))
            .limit(1);

        if (!post) {
            res.status(404).json({ error: "Post not found for this shop" });
            return;
        }

        if (post.postStatus !== "pending_owner") {
            res.status(400).json({ error: "Only posts waiting for owner approval can be rejected here" });
            return;
        }

        await db
            .update(posts)
            .set({
                postStatus: "rejected",
                postRejectedReason: reason,
                postModeratedAt: new Date(),
            })
            .where(eq(posts.postId, postId));

        res.json({ message: "Post rejected successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
