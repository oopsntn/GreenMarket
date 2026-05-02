// utils/jwt.ts
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JWTUserPayload } from "../dtos/auth";

export function verifyJWT(token: string): JWTUserPayload {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (
        typeof decoded !== "object" ||
        decoded === null ||
        !("id" in decoded) ||
        !("role" in decoded)
    ) {
        throw new Error("Invalid token payload");
    }

    return decoded as JWTUserPayload;
}