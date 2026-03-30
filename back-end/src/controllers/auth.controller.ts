import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { db } from "../config/db";
import {
  admins,
  users,
  otpRequests,
  adminRoles,
  roles,
} from "../models/schema";
import { AdminLoginBody } from "../dtos/admin";
import { RequestOTPBody, VerifyOTPBody } from "../dtos/otp";

import { otpService } from "../services/otp.service";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const ADMIN_WEB_ROLE_CODES = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"];

// --- Admin ---
export const adminLogin = async (
  req: Request<{}, {}, AdminLoginBody>,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.adminEmail, email));

    if (!admin) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isValid = await bcrypt.compare(password, admin.adminPasswordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const roleRows = await db
      .select({
        roleCode: roles.roleCode,
      })
      .from(adminRoles)
      .innerJoin(roles, eq(adminRoles.adminRoleRoleId, roles.roleId))
      .where(eq(adminRoles.adminRoleAdminId, admin.adminId));

    const roleCodes = roleRows
      .map((row) => row.roleCode)
      .filter((code): code is string => Boolean(code));

    const allowedAdminWeb = roleCodes.some((code) =>
      ADMIN_WEB_ROLE_CODES.includes(code),
    );

    if (!allowedAdminWeb) {
      res.status(403).json({
        error:
          "Access denied. This account is not allowed to access admin web.",
      });
      return;
    }

    const token = jwt.sign(
      {
        id: admin.adminId,
        email: admin.adminEmail,
        role: "admin",
        roleCodes: roleCodes.length > 0 ? roleCodes : ["ROLE_ADMIN"],
      },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      token,
      admin: {
        id: admin.adminId,
        email: admin.adminEmail,
        name: admin.adminFullName,
        roleCodes,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- User (OTP) ---
export const userRequestOtp = async (
  req: Request<{}, {}, RequestOTPBody>,
  res: Response,
): Promise<void> => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      res.status(400).json({ error: "Mobile number required" });
      return;
    }

    const sendResult = await otpService.sendOTP(mobile);

    if (!sendResult.success) {
      res.status(500).json({ error: sendResult.message });
      return;
    }

    await db.insert(otpRequests).values({
      otpRequestMobile: mobile,
      otpRequestOtpCode: "TWILIO_VERIFY",
      otpRequestExpireAt: new Date(Date.now() + 10 * 60 * 1000),
      otpRequestStatus: "pending",
    });

    res.json({ message: sendResult.message });
  } catch (error: any) {
    console.error("[AUTH CONTROLLER] userRequestOtp Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

export const userVerifyOtp = async (
  req: Request<{}, {}, VerifyOTPBody>,
  res: Response,
): Promise<void> => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      res.status(400).json({ error: "Mobile and OTP required" });
      return;
    }

    const verifyResult = await otpService.verifyOTP(mobile, otp);

    if (!verifyResult.success) {
      res.status(401).json({ error: verifyResult.message });
      return;
    }

    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.userMobile, mobile));

    const now = new Date();

    if (!user) {
      const [newUser] = (await db
        .insert(users)
        .values({
          userMobile: mobile,
          userStatus: "active",
          userRegisteredAt: now,
          userCreatedAt: now,
          userUpdatedAt: now,
          userLastLoginAt: now,
        })
        .returning()) as any[];

      user = newUser;
    } else {
      await db
        .update(users)
        .set({ userLastLoginAt: now })
        .where(eq(users.userId, user.userId));
    }

    await db
      .update(otpRequests)
      .set({ otpRequestStatus: "verified" })
      .where(
        and(
          eq(otpRequests.otpRequestMobile, mobile),
          eq(otpRequests.otpRequestStatus, "pending"),
        ),
      );

    const token = jwt.sign(
      { id: user.userId, mobile: user.userMobile, role: "user" },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.userId,
        mobile: user.userMobile,
        name: user.userDisplayName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
