import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { db } from "../config/db";
import { admins, users, otpRequests } from "../models/schema";
import { AdminLoginBody } from "../dtos/admin";
import { RequestOTPBody, VerifyOTPBody } from "../dtos/otp";

import { otpService } from "../services/otp.service";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// --- Admin ---
export const adminLogin = async (
    req: Request<{}, {}, AdminLoginBody>,
    res: Response
): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: "Email and password required" });
            return;
        }

        const [admin] = await db.select().from(admins).where(eq(admins.adminEmail, email));

        if (!admin) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        const isValid = await bcrypt.compare(password, admin.adminPasswordHash);
        if (!isValid) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        const token = jwt.sign(
            { id: admin.adminId, email: admin.adminEmail, role: "admin" },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ token, admin: { id: admin.adminId, email: admin.adminEmail, name: admin.adminFullName } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// --- User (OTP) ---
export const userRequestOtp = async (
    req: Request<{}, {}, RequestOTPBody>,
    res: Response
): Promise<void> => {
    try {
        const { mobile } = req.body;
        if (!mobile) {
            res.status(400).json({ error: "Mobile number required" });
            return;
        }

        const otpCode = otpService.generateOTP();
        const expireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await db.insert(otpRequests).values({
            otpRequestMobile: mobile,
            otpRequestOtpCode: otpCode,
            otpRequestExpireAt: expireAt,
            otpRequestStatus: "pending",
        });

        const sendResult = await otpService.sendOTP(mobile, otpCode);

        res.json({ 
            message: sendResult.message, 
            otp: otpCode // Keep returning for testing/dev
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const userVerifyOtp = async (
    req: Request<{}, {}, VerifyOTPBody>,
    res: Response
): Promise<void> => {
    try {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) {
            res.status(400).json({ error: "Mobile and OTP required" });
            return;
        }

        const [otpRecord] = await db
            .select()
            .from(otpRequests)
            .where(
                and(
                    eq(otpRequests.otpRequestMobile, mobile),
                    eq(otpRequests.otpRequestOtpCode, otp),
                    eq(otpRequests.otpRequestStatus, "pending")
                )
            )
            .orderBy(otpRequests.otpRequestCreatedAt);

        if (!otpRecord || (otpRecord.otpRequestExpireAt && otpRecord.otpRequestExpireAt < new Date())) {
            res.status(401).json({ error: "Invalid or expired OTP" });
            return;
        }

        // Mark OTP as used
        await db
            .update(otpRequests)
            .set({ otpRequestStatus: "verified" })
            .where(eq(otpRequests.otpRequestId, otpRecord.otpRequestId));

        // Check if user exists, otherwise create
        let [user] = await db.select().from(users).where(eq(users.userMobile, mobile));

        if (!user) {
            [user] = await db
                .insert(users)
                .values({
                    userMobile: mobile,
                    userStatus: "active",
                    userRegisteredAt: new Date(),
                })
                .returning();
        } else {
            // Update last login
            await db
                .update(users)
                .set({ userLastLoginAt: new Date() })
                .where(eq(users.userId, user.userId));
        }

        const token = jwt.sign(
            { id: user.userId, mobile: user.userMobile, role: "user" },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token, user: { id: user.userId, mobile: user.userMobile, name: user.userDisplayName } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
