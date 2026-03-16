import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { qrSessions, users } from "../../models/schema";
import { AuthRequest } from "../../dtos/auth";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// --- Web Client ---

/**
 * Generate a new QR session for the web client.
 */
export const generateQR = async (req: Request, res: Response): Promise<void> => {
    try {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
        const [session] = await db.insert(qrSessions).values({
            status: "pending",
            expiresAt,
        }).returning();

        res.json({
            message: "QR Session generated",
            sessionId: session.id,
            expiresAt: session.expiresAt
        });
    } catch (error) {
        console.error("[QR AUTH] Generate Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Check the status of a QR session (Polled by the web client).
 */
export const checkQRStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = req.params.sessionId as string;
        if (!sessionId) {
            res.status(400).json({ error: "sessionId required" });
            return;
        }

        const [session] = await db.select().from(qrSessions).where(eq(qrSessions.id, sessionId));

        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        if (new Date() > new Date(session.expiresAt)) {
            // Update to expired if it's still pending/scanned
            if (session.status !== "expired" && session.status !== "authorized") {
                await db.update(qrSessions).set({ status: "expired" }).where(eq(qrSessions.id, sessionId));
            }
            res.status(400).json({ error: "Session expired", status: "expired" });
            return;
        }

        if (session.status === "authorized" && session.userId) {
            // Generate JWT for web client
            const [user] = await db.select().from(users).where(eq(users.userId, session.userId));
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            const token = jwt.sign(
                { id: user.userId, mobile: user.userMobile, role: "user" },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({
                status: "authorized",
                token,
                user: {
                    id: user.userId,
                    mobile: user.userMobile,
                    name: user.userDisplayName
                }
            });
            return;
        }

        res.json({ status: session.status });
    } catch (error) {
        console.error("[QR AUTH] Check Status Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// --- Mobile Client (Requires Auth) ---

export const scanQR = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const sessionId = req.body.sessionId as string;
        if (!sessionId) {
            res.status(400).json({ error: "sessionId required" });
            return;
        }

        const [session] = await db.select().from(qrSessions).where(eq(qrSessions.id, sessionId));

        if (!session || session.status === "expired" || new Date() > new Date(session.expiresAt)) {
            res.status(400).json({ error: "Sesiion is invalid or expired" });
            return;
        }

        if (session.status === "pending") {
            await db.update(qrSessions).set({ status: "scanned" }).where(eq(qrSessions.id, sessionId));
            res.json({ message: "QR Scanned successfully. Waiting for authorization." });
            return;
        }

        res.status(400).json({ error: `Session already in state: ${session.status}` });
    } catch (error) {
        console.error("[QR AUTH] Scan Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const authorizeQR = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const sessionId = req.body.sessionId as string;
        const mobileUserId = req.user?.id;

        if (!sessionId || !mobileUserId) {
            res.status(400).json({ error: "sessionId and user auth required" });
            return;
        }

        const [session] = await db.select().from(qrSessions).where(eq(qrSessions.id, sessionId));

        if (!session || session.status === "expired" || new Date() > new Date(session.expiresAt)) {
            res.status(400).json({ error: "Sesiion is invalid or expired" });
            return;
        }

        if (session.status === "scanned") {
            await db.update(qrSessions).set({ 
                status: "authorized", 
                userId: mobileUserId 
            }).where(eq(qrSessions.id, sessionId));
            
            res.json({ message: "Login authorized successfully for web client" });
            return;
        }

        res.status(400).json({ error: `Cannot authorize. Current status is ${session.status}. Expected 'scanned'.` });
    } catch (error) {
        console.error("[QR AUTH] Authorize Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
