import { Response, NextFunction, RequestHandler } from "express";
import { JWTUserPayload } from "../dtos/auth";
import { db } from "../config/db";
import { businessRoles, users, shops } from "../models/schema/index";
import { eq, and } from "drizzle-orm";
import { verifyJWT } from "../utils/jwt";

const ADMIN_ROLE_CODES = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"];

const getRoleCodes = (user?: JWTUserPayload): string[] => {
    if (!user) {
        return [];
    }

    if (user.roleCodes && user.roleCodes.length > 0) {
        return user.roleCodes;
    }

    if (user.role === "admin") {
        return ["ROLE_ADMIN"];
    }

    return [];
};

const getActiveBusinessRoleCode = async (userId: number) => {
    const [roleRow] = await db
        .select({
            roleCode: businessRoles.businessRoleCode,
            roleStatus: businessRoles.businessRoleStatus,
        })
        .from(users)
        .leftJoin(
            businessRoles,
            eq(users.userBusinessRoleId, businessRoles.businessRoleId),
        )
        .where(eq(users.userId, userId))
        .limit(1);

    if (!roleRow?.roleCode) {
        return null;
    }

    if (roleRow.roleStatus?.toLowerCase() !== "active") {
        return null;
    }

    return roleRow.roleCode.toUpperCase();
};

export const verifyToken: RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const token = authHeader.split(" ")[1];
        req.user = verifyJWT(token);
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
};

export const optionalVerifyToken: RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return next();
    }

    try {
        const token = authHeader.split(" ")[1];
        req.user = verifyJWT(token);
    } catch {
        // ignore
    }

    next();
};

export const isAdmin: RequestHandler = (req, res, next): void => {
    if (!req.user) {
        res.status(403).json({ error: "Access denied. Admin privileges required." });
        return;
    }

    if (req.user.role === "admin") {
        next();
        return;
    }

    const roleCodes = getRoleCodes(req.user);
    const hasAdminRole = roleCodes.some((code) => ADMIN_ROLE_CODES.includes(code));
    if (!hasAdminRole) {
        res.status(403).json({ error: "Access denied. Admin privileges required." });
        return;
    }

    next();
};

export const requireRoles = (...allowedRoles: string[]) => {
    const handler: RequestHandler = (req, res, next): void => {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        // Keep current admin behavior working with legacy tokens.
        if (req.user.role === "admin" && (!req.user.roleCodes || req.user.roleCodes.length === 0)) {
            next();
            return;
        }

        const roleCodes = getRoleCodes(req.user);
        const hasRequiredRole = roleCodes.some((code) => allowedRoles.includes(code));

        if (!hasRequiredRole) {
            res.status(403).json({ error: "Access denied. Insufficient role permissions." });
            return;
        }

        next();
    };

    return handler;
};

export const requireBusinessRole = (...allowedBusinessRoles: string[]) => {
    const normalizedAllowedRoles = allowedBusinessRoles.map((role) =>
        role.toUpperCase(),
    );

    const handler: RequestHandler = async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            if (user.role !== "user") {
                return res.status(403).json({ error: "Access denied. User account required." });
            }

            const currentRoleCode = await getActiveBusinessRoleCode(user.id);

            if (!currentRoleCode) {
                return res.status(403).json({
                    error: "Access denied. Active business role is required.",
                });
            }

            user.businessRoleCode = currentRoleCode;

            const hasPermission = normalizedAllowedRoles.includes(currentRoleCode);
            if (!hasPermission) {
                return res.status(403).json({ error: "Access denied. Insufficient business role permissions." });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }
    };

    return handler;
};

export const requireShop: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [shop] = await db
            .select()
            .from(shops)
            .where(
                and(
                    eq(shops.shopId, userId),
                    eq(shops.shopStatus, "active")
                )
            )
            .limit(1);

        if (!shop) {
            return res.status(403).json({ error: "Access denied. Active shop profile required." });
        }

        req.shop = shop;
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
