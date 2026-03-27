import { Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JWTUserPayload } from "../dtos/auth";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const ADMIN_ROLE_CODES = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR", "ROLE_SUPPORT", "ROLE_FINANCE"];

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
