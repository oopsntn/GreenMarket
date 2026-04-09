import { Request } from "express";

export interface JWTUserPayload {
    id: number;
    email?: string;
    mobile?: string;
    role: string;
    roleCodes?: string[];
    businessRoleCode?: string | null;
}

export interface AuthRequest extends Request {
    user?: JWTUserPayload;
}
