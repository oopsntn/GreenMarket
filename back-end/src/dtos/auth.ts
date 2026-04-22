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

export interface AuthRequest extends Request {
    user?: JWTUserPayload;
    shop?: Shop;
}
