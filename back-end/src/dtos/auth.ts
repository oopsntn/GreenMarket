import { Request } from "express";

export interface JWTUserPayload {
    id: number;
    email?: string;
    mobile?: string;
    role: string;
    roleCodes?: string[];
}

export interface AuthRequest extends Request {
    user?: JWTUserPayload;
}
