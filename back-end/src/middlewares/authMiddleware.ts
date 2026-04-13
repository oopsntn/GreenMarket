import { Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JWTUserPayload } from "../dtos/auth";
import { db } from "../config/db.ts";
import { businessRoles, users } from "../models/schema/index.ts";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const ADMIN_ROLE_CODES = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_SUPPORT", "ROLE_MODERATOR", "ROLE_FINANCE"];

const getRoleCodes = (user?: JWTUserPayload): string[] => {
    if (!user) {
        return [];
    }

    if (user.roleCodes && user.roleCodes.length > 0) {
        return user.roleCodes;
    }

    // Backward compatibility for old admin tokens without roleCodes.
    if (user.role === "admin") {
        return ["ROLE_ADMIN"];
    }

    return [];
};

const getActiveBusinessRoleCode = async (userId: number): Promise<string | null> => {
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

export const verifyToken: RequestHandler = (req, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Access denied. No token provided." });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTUserPayload;
        authReq.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token." });
    }
};

export const optionalVerifyToken: RequestHandler = (
    req,
    _res: Response,
    next: NextFunction,
): void => {
    const authReq = req as AuthRequest;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        next();
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTUserPayload;
        authReq.user = decoded;
    } catch {
        // Public endpoints should still work even if an invalid token is sent.
    }

    next();
};

export const isAdmin: RequestHandler = (req, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
        res.status(403).json({ error: "Access denied. Admin privileges required." });
        return;
    }

    if (authReq.user.role === "admin") {
        next();
        return;
    }

    const roleCodes = getRoleCodes(authReq.user);
    const hasAdminRole = roleCodes.some((code) => ADMIN_ROLE_CODES.includes(code));
    if (!hasAdminRole) {
        res.status(403).json({ error: "Access denied. Admin privileges required." });
        return;
    }

    next();
};

export const requireRoles = (...allowedRoles: string[]) => {
    const handler: RequestHandler = (req, res: Response, next: NextFunction): void => {
        const authReq = req as AuthRequest;
        if (!authReq.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        // Keep current admin behavior working with legacy tokens.
        if (authReq.user.role === "admin" && (!authReq.user.roleCodes || authReq.user.roleCodes.length === 0)) {
            next();
            return;
        }

        const roleCodes = getRoleCodes(authReq.user);
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

    const handler: RequestHandler = async (
        req,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;

            if (!userId || !authReq.user) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            if (authReq.user.role !== "user") {
                res
                    .status(403)
                    .json({ error: "Access denied. User account required." });
                return;
            }

            const currentRoleCode = await getActiveBusinessRoleCode(userId);

            if (!currentRoleCode) {
                res.status(403).json({
                    error: "Access denied. Active business role is required.",
                });
                return;
            }

            authReq.user.businessRoleCode = currentRoleCode;

            const hasPermission = normalizedAllowedRoles.includes(currentRoleCode);
            if (!hasPermission) {
                res.status(403).json({
                    error: "Access denied. Insufficient business role permissions.",
                });
                return;
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    };

    return handler;
};
