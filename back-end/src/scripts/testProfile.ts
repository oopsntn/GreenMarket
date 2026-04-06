import { db } from "../config/db.ts";
import { users } from "../models/schema/index.ts";
import { eq } from "drizzle-orm";

async function testUserProfile() {
    console.log("--- Starting User Profile Integration Test ---");

    try {
        // 1. Setup: Create a temporary user
        console.log("1. Creating temporary user...");
        const mobile = "0999000111";
        const [user] = await db.insert(users).values({
            userMobile: mobile,
            userDisplayName: "User Original Name",
            userAvatarUrl: null
        }).returning();
        
        console.log(`User created with ID: ${user.userId}`);

        // 2. Update Profile
        console.log("\n2. Updating profile...");
        const newName = "User Updated Name 🌿";
        const newAvatar = "/uploads/profiles/test-avatar.jpg";
        const newEmail = "test@greenmarket.com";
        
        const [updatedUser] = await db.update(users)
            .set({ 
                userDisplayName: newName,
                userAvatarUrl: newAvatar,
                userEmail: newEmail,
                userUpdatedAt: new Date()
            })
            .where(eq(users.userId, user.userId))
            .returning();

        if (
            updatedUser.userDisplayName === newName && 
            updatedUser.userAvatarUrl === newAvatar &&
            updatedUser.userEmail === newEmail
        ) {
            console.log("✅ Profile update successful in DB.");
        } else {
            console.error("Mismatch values:", updatedUser);
            throw new Error("❌ Profile update failed to match expected values.");
        }

        // 3. Fetch Profile (simulating getProfile controller logic)
        console.log("\n3. Fetching profile to verify...");
        const [fetchedUser] = await db.select().from(users).where(eq(users.userId, user.userId)).limit(1);
        
        if (fetchedUser.userDisplayName === newName) {
            console.log(`✅ Verified: Display Name is "${fetchedUser.userDisplayName}"`);
        } else {
            console.log(`❌ Verification Failed: Expected "${newName}" but got "${fetchedUser.userDisplayName}"`);
        }

        // 4. Cleanup
        console.log("\n4. Cleaning up test data...");
        await db.delete(users).where(eq(users.userId, user.userId));
        console.log("✅ Cleanup done.");

        console.log("\n--- TEST PASSED SUCCESSFULLY ---");

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error);
    }
}

testUserProfile();
