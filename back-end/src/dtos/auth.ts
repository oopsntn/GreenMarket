import { Request } from "express";
import { Shop } from "../models/schema/shops";

export interface JWTUserPayload {
    id: number;
    email?: string;
    name?: string;
    mobile?: string;
    role: string;
    roleCodes?: string[];
    businessRoleCode?: string | null;
}

declare global {
    namespace Express {
        interface Request {
            user?: JWTUserPayload;
            shop?: Shop;
        }
    }
}

export interface AuthRequest extends Request {}
