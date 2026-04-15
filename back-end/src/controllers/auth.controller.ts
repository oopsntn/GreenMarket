import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../config/db";
import {
  admins,
  users,
  adminRoles,
  roles,
  businessRoles,
} from "../models/schema";
import { AdminLoginBody } from "../dtos/admin";
import { RequestOTPBody, VerifyOTPBody } from "../dtos/otp";
import { verificationService } from "../services/verification.service";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const ADMIN_WEB_ROLE_CODES = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"];

const buildUserAuthQuery = () =>
  db
    .select({
      id: users.userId,
      mobile: users.userMobile,
      name: users.userDisplayName,
      avatarUrl: users.userAvatarUrl,
      email: users.userEmail,
      location: users.userLocation,
      bio: users.userBio,
      status: users.userStatus,
      businessRoleId: businessRoles.businessRoleId,
      businessRoleCode: businessRoles.businessRoleCode,
      businessRoleTitle: businessRoles.businessRoleTitle,
      businessRoleAudienceGroup: businessRoles.businessRoleAudienceGroup,
      businessRoleAccessScope: businessRoles.businessRoleAccessScope,
      businessRoleStatus: businessRoles.businessRoleStatus,
    })
    .from(users)
    .leftJoin(
      businessRoles,
      eq(users.userBusinessRoleId, businessRoles.businessRoleId),
    );

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
        name: admin.adminFullName,
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

    const sendResult = await verificationService.requestOTP(mobile, "phone");

    if (!sendResult.success) {
      res.status(500).json({ error: sendResult.message });
      return;
    }

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

    const verifyResult = await verificationService.verifyOTP(
      mobile,
      otp,
      "phone",
    );

    if (!verifyResult.success) {
      res.status(401).json({ error: verifyResult.message });
      return;
    }

    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.userMobile, mobile));

    const now = new Date();

    if (!existingUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          userMobile: mobile,
          userStatus: "active",
          userRegisteredAt: now,
          userCreatedAt: now,
          userUpdatedAt: now,
          userLastLoginAt: now,
        })
        .returning();

      existingUser = newUser;
    } else {
      await db
        .update(users)
        .set({
          userLastLoginAt: now,
          userUpdatedAt: now,
        })
        .where(eq(users.userId, existingUser.userId));
    }

    const [userWithRole] = await buildUserAuthQuery()
      .where(eq(users.userId, existingUser.userId))
      .limit(1);

    const token = jwt.sign(
      {
        id: existingUser.userId,
        mobile: existingUser.userMobile,
        role: "user",
        businessRoleCode: userWithRole?.businessRoleCode ?? null,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: userWithRole ?? {
        id: existingUser.userId,
        mobile: existingUser.userMobile,
        name: existingUser.userDisplayName,
        avatarUrl: existingUser.userAvatarUrl,
        email: existingUser.userEmail,
        location: existingUser.userLocation,
        bio: existingUser.userBio,
        status: existingUser.userStatus,
        businessRoleId: null,
        businessRoleCode: null,
        businessRoleTitle: null,
        businessRoleAudienceGroup: null,
        businessRoleAccessScope: null,
        businessRoleStatus: null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
