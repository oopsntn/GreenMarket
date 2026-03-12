import axios from "axios";

const BASE_URL = "http://localhost:5000/api/admin";

async function testBonsaiSystem() {
    try {
        console.log("--- Starting Bonsai Product & Attribute Test ---");

        // 1. Create Attribute: Nguồn gốc (Origin)
        console.log("\n1. Creating Attribute: Nguồn gốc...");
        const attrRes = await axios.post(`${BASE_URL}/attributes`, {
            attributeCode: "origin",
            attributeTitle: "Nguồn gốc",
            attributeDataType: "text",
            attributePublished: true
        });
        const attribute = attrRes.data;
        console.log("Attribute Created:", attribute.attributeTitle);

        // 2. Create Category: Cây cảnh Bonsai
        console.log("\n2. Creating Category: Cây cảnh Bonsai...");
        const catRes = await axios.post(`${BASE_URL}/categories`, {
            categoryTitle: "Cây cảnh Bonsai",
        });
        const category = catRes.data;
        console.log("Category Created:", category.categoryTitle);

        // 3. Create Product: Cây Tùng La Hán (Bonsai Ficus)
        console.log("\n3. Creating Product: Tùng La Hán...");
        const prodRes = await axios.post(`${BASE_URL}/products`, {
            categoryId: category.categoryId,
            productTitle: "Tùng La Hán Bonsai Nhật Bản",
            productDescription: "Một tác phẩm nghệ thuật sống động với độ tuổi hơn 10 năm.",
            productPrice: 5500000,
            productStock: 1,
            productStatus: "published",
            images: [
                "https://example.com/bonsai-1.jpg",
                "https://example.com/bonsai-2.jpg"
            ],
            attributes: [
                { id: attribute.attributeId, value: "Nhật Bản" }
            ]
        });
        const product = prodRes.data;
        console.log("Product Created ID:", product.productId);

        // 4. Get Product Details (Verify everything is linked)
        console.log("\n4. Fetching Product Details...");
        const detailRes = await axios.get(`${BASE_URL}/products/${product.productId}`);
        const details = detailRes.data;
        console.log("Product Title:", details.productTitle);
        console.log("Images count:", details.images.length);
        console.log("Attributes count:", details.attributes.length);
        console.log("Origin value:", details.attributes[0].attributeValue);

        // 5. Cleanup
        console.log("\n5. Cleanup...");
        await axios.delete(`${BASE_URL}/products/${product.productId}`);
        await axios.delete(`${BASE_URL}/categories/${category.categoryId}`);
        await axios.delete(`${BASE_URL}/attributes/${attribute.attributeId}`);
        console.log("Cleanup successful.");

        console.log("\n--- Bonsai System Test Finished Successfully ---");
    } catch (error: any) {
        console.error("Test failed:", error.response?.data || error.message);
    }
}

testBonsaiSystem();
