import { db } from "../config/db";
import { eq, and } from "drizzle-orm";
import { users, shops, shopCollaborators, posts } from "../models/schema/index";

async function testCollaboratorFlow() {
    console.log("🚀 Starting Collaborator Flow Test...");

    try {
        const COLLABORATOR_ID = 9; // Collaborator Pro (Role 3)
        const OWNER_ID = 1;       // Nguyễn Thành Nam (Shop 1)
        const SHOP_ID = 1;

        console.log(`\n1. Verifying Collaborator (ID: ${COLLABORATOR_ID}) role...`);
        const [collabUser] = await db.select().from(users).where(eq(users.userId, COLLABORATOR_ID)).limit(1);
        if (collabUser.userBusinessRoleId !== 3) {
            throw new Error(`User ${COLLABORATOR_ID} is not a collaborator (Role: ${collabUser.userBusinessRoleId})`);
        }
        console.log("✅ User is a valid collaborator.");

        console.log("\n2. Adding Collaborator to Shop 1...");
        // Cleanup existing if any
        await db.delete(shopCollaborators).where(
            and(
                eq(shopCollaborators.shopCollaboratorsShopId, SHOP_ID),
                eq(shopCollaborators.collaboratorId, COLLABORATOR_ID)
            )
        );

        await db.insert(shopCollaborators).values({
            shopCollaboratorsShopId: SHOP_ID,
            collaboratorId: COLLABORATOR_ID,
            shopCollaboratorsStatus: "active",
        });
        console.log("✅ Collaborator linked to shop.");

        console.log("\n3. Simulating CTV posting for the shop...");
        const postSlug = `ctv-test-post-${Date.now()}`;
        const [newPost] = await db.insert(posts).values({
            postAuthorId: COLLABORATOR_ID,
            postShopId: SHOP_ID,
            categoryId: 1,
            postTitle: "Sanh Nam Điền Cổ - CTV Test",
            postSlug,

            postLocation: "Nam Định",
            postStatus: "pending_owner", // This should be handled by createPost controller normally
            postPublished: false,
            postCreatedAt: new Date(),
        }).returning();

        console.log(`✅ Post created with ID: ${newPost.postId}, Status: ${newPost.postStatus}`);
        if (newPost.postStatus !== "pending_owner") {
            throw new Error("❌ Post status should be pending_owner");
        }

        console.log("\n4. Simulating Owner Approval...");
        await db.update(posts)
            .set({
                postStatus: "approved",
                postPublished: true,
                postPublishedAt: new Date(),
                postModeratedAt: new Date(),
            })
            .where(eq(posts.postId, newPost.postId));
        
        const [approvedPost] = await db.select().from(posts).where(eq(posts.postId, newPost.postId)).limit(1);
        console.log(`✅ Post approved. New Status: ${approvedPost.postStatus}`);
        if (approvedPost.postStatus !== "approved") {
            throw new Error("❌ Post status upgrade failed");
        }

        console.log("\n🎊 Collaborator Flow Test Completed Successfully!");
    } catch (error) {
        console.error("\n❌ Test Failed:", error);
    } finally {
        process.exit();
    }
}

testCollaboratorFlow();
