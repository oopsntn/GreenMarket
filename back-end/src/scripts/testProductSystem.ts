import axios from "axios";
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:5000/api/admin";

async function testBonsaiSystem() {
    try {
        console.log("--- Starting Bonsai Product & Attribute Test ---");

        // 1. Create a temporary user for authoring
        const { users } = await import("../models/schema/users.ts");
        const { db } = await import("../config/db.ts");
        const [user] = await db.insert(users).values({
            userMobile: "0999888777",
            userDisplayName: "Admin Test User",
        }).returning();

        // 2. Create Attribute: Nguồn gốc (Origin)
        console.log("\n1. Creating Attribute: Nguồn gốc...");
        const attrRes = await axios.post(`${BASE_URL}/attributes`, {
            attributeCode: "origin",
            attributeTitle: "Nguồn gốc",
            attributeDataType: "text",
            attributePublished: true
        });
        const attribute = attrRes.data;
        console.log("Attribute Created:", attribute.attributeTitle);

        // 3. Create Category: Cây cảnh Bonsai
        console.log("\n2. Creating Category: Cây cảnh Bonsai...");
        const catRes = await axios.post(`${BASE_URL}/categories`, {
            categoryTitle: "Cây cảnh Bonsai",
        });
        const category = catRes.data;
        console.log("Category Created:", category.categoryTitle);

        // 4. Create Post: Cây Tùng La Hán
        console.log("\n3. Creating Post: Tùng La Hán...");
        const prodRes = await axios.post(`${BASE_URL}/posts`, {
            postAuthorId: user.userId,
            categoryId: category.categoryId,
            postTitle: "Tùng La Hán Bonsai Nhật Bản",
            postPrice: 5500000,
            postStatus: "approved",
            images: [
                "https://example.com/bonsai-1.jpg",
                "https://example.com/bonsai-2.jpg"
            ],
            attributes: [
                { id: attribute.attributeId, value: "Nhật Bản" }
            ]
        });
        const post = prodRes.data;
        console.log("Post Created ID:", post.postId);

        // 5. Get Post Details
        console.log("\n4. Fetching Post Details...");
        const detailRes = await axios.get(`${BASE_URL}/posts/${post.postId}`);
        const details = detailRes.data;
        console.log("Post Title:", details.postTitle);
        console.log("Images count:", details.images.length);
        console.log("Attributes count:", details.attributes.length);

        // 6. Cleanup
        console.log("\n5. Cleanup...");
        await axios.delete(`${BASE_URL}/posts/${post.postId}`);
        await axios.delete(`${BASE_URL}/categories/${category.categoryId}`);
        await axios.delete(`${BASE_URL}/attributes/${attribute.attributeId}`);
        await db.delete(users).where(eq(users.userId, user.userId));
        console.log("Cleanup successful.");

        console.log("\n--- Bonsai System Test Finished Successfully ---");
    } catch (error: any) {
        console.error("Test failed:", error.response?.data || error.message);
    }
}

testBonsaiSystem();
