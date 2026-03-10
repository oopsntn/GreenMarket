import { db } from "../config/db";
import { admins } from "../models/schema/admins";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const seedAdmin = async () => {
    try {
        const email = process.argv[2] || "admin@greenmarket.vn";
        const password = process.argv[3] || "Admin@123";

        console.log(`Seeding Admin: ${email}`);

        const hashedPassword = await bcrypt.hash(password, 10);

        const [newAdmin] = await db.insert(admins).values({
            adminEmail: email,
            adminPasswordHash: hashedPassword,
            adminFullName: "System Administrator",
            adminStatus: "active"
        }).returning();

        console.log("Admin seeded successfully:", newAdmin.adminId, newAdmin.adminEmail);
        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
