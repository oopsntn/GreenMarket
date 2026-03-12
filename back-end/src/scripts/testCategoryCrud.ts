import axios from "axios";

const API_URL = "http://localhost:5000/api/admin/categories";

async function testCategoryCascadeDelete() {
    try {
        console.log("--- Starting Category Cascade Delete Test ---");

        // 1. Create Parent Category
        console.log("\n1. Creating Parent Category...");
        const parentRes = await axios.post(API_URL, { categoryTitle: "Điện thoại & Phụ kiện" });
        const parent = parentRes.data;
        console.log("Created Parent ID:", parent.categoryId);

        // 2. Create Child Category
        console.log("\n2. Creating Child Category...");
        const childRes = await axios.post(API_URL, { 
            categoryTitle: "Ốp lưng", 
            categoryParentId: parent.categoryId 
        });
        const child = childRes.data;
        console.log("Created Child ID:", child.categoryId);

        // 3. Verify they exist
        const all = await axios.get(API_URL);
        console.log("\n3. Current Category count:", all.data.length);

        // 4. Delete Parent Category (should cascade)
        console.log(`\n4. Deleting Parent Category (${parent.categoryId})...`);
        const delRes = await axios.delete(`${API_URL}/${parent.categoryId}`);
        console.log("Delete result:", delRes.data.message);

        // 5. Verify Child is also gone from DB
        console.log("\n5. Verifying if Child Category still exists...");
        try {
            await axios.get(`${API_URL}/${child.categoryId}`);
            console.log("FAIL: Child still exists!");
        } catch (err: any) {
            if (err.response?.status === 404) {
                console.log("SUCCESS: Child category was automatically deleted (Cascade works)");
            } else {
                console.log("Error checking child:", err.message);
            }
        }

        // 6. Verify full count
        const finalAll = await axios.get(API_URL);
        console.log("\n6. Final Category count:", finalAll.data.length);

        console.log("\n--- Category Cascade Delete Test Finished Successfully ---");
    } catch (error: any) {
        console.error("Test failed:", error.response?.data || error.message);
    }
}

testCategoryCascadeDelete();
