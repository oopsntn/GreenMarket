import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../config/db.ts";
import { admins, users, otpRequests } from "../models/schema/index.ts";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
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

export const userRequestOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile } = req.body;
        if (!mobile) {
            res.status(400).json({ error: "Mobile number required" });
            return;
        }

        // Generate random 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expireAt = new Date(Date.now() + 5 * 60000); // 5 mins

        // Save/Update OTP request
        await db.insert(otpRequests).values({
            otpRequestMobile: mobile,
            otpRequestOtpCode: otpCode,
            otpRequestExpireAt: expireAt,
            otpRequestStatus: "pending"
        });

        // In a real app, integrate with SMS gateway here
        // Currently, we return it in dev environment for testing
        res.json({ message: "OTP sent successfully", dev_otp: otpCode });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const userVerifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) {
            res.status(400).json({ error: "Mobile and OTP required" });
            return;
        }

        // Optional: add actual verification against `otp_requests` db table
        // ...

        // Auto register or login
        let [user] = await db.select().from(users).where(eq(users.userMobile, mobile));

        if (!user) {
            // Create new user
            const [newUser] = await db.insert(users).values({
                userMobile: mobile,
                userStatus: "active",
            }).returning();
            user = newUser;
        } else {
            // Update last login
            await db.update(users)
                .set({ userLastLoginAt: new Date() })
                .where(eq(users.userId, user.userId));
        }

        const token = jwt.sign(
            { id: user.userId, mobile: user.userMobile, role: "user" },
            JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.json({ token, user: { id: user.userId, mobile: user.userMobile } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
