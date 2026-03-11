import { db } from "../config/db";
import { admins } from "../models/schema/admins";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const seedAdmin = async () => {
    const email = process.argv[2] || "admin@greenmarket.vn";
    const password = process.argv[3] || "Admin@123";

    console.log(`Seeding Admin: ${email}`);

    const existing = await db.query.admins.findFirst({
        where: (admins, { eq }) => eq(admins.adminEmail, email)
    });

    if (existing) {
        console.log("Admin already exists");
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newAdmin] = await db
        .insert(admins)
        .values({
            adminEmail: email,
            adminPasswordHash: hashedPassword,
            adminFullName: "System Administrator",
            adminStatus: "active"
        })
        .returning();

    console.log(
        "Admin seeded successfully:",
        newAdmin.adminId,
        newAdmin.adminEmail
    );
};

seedAdmin();