import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JWTUserPayload } from "../dtos/auth";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Access denied. No token provided." });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTUserPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token." });
    }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "manager")) {
        res.status(403).json({ error: "Access denied. Admin privileges required." });
        return;
    }
    next();
};
