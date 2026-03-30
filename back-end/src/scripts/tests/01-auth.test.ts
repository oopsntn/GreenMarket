import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

async function runAuthTests() {
    console.log("--- Starting Test 01: Authentication (JWT) ---");

    try {
        // Test 1: Accessing a protected route without token
        console.log("\n[Test] Calling POST /posts without token...");
        try {
            await axios.post(`${BASE_URL}/posts`, {
                categoryId: 1,
                postTitle: "Unauthorized Post",
            });
            console.log("❌ Failed: Post creation without token should be 401");
            process.exit(1);
        } catch (error: any) {
            if (error.response?.status === 401) {
                console.log("✅ Passed: Unauthenticated request blocked (401 Unauthorized)");
            } else {
                console.log("❌ Failed: Unauthenticated request returned unexpected status:", error.response?.status);
                process.exit(1);
            }
        }

        // Test 2: Accessing a protected route with an invalid token
        console.log("\n[Test] Calling POST /posts with an invalid token...");
        try {
            await axios.post(`${BASE_URL}/posts`, {
                categoryId: 1,
                postTitle: "Invalid Token Post",
            }, {
                headers: { Authorization: "Bearer INVALID_TOKEN_123" }
            });
            console.log("❌ Failed: Request with invalid token should be 401 or 403");
            process.exit(1);
        } catch (error: any) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log(`✅ Passed: Invalid token request blocked (${error.response.status})`);
            } else {
                console.log("❌ Failed: Request returned unexpected status:", error.response?.status);
                process.exit(1);
            }
        }

        console.log("\n🎉 All Test 01: Authentication passed.\n");
    } catch (error: any) {
        console.error("Test execution failed:", error.response?.data || error.message);
        process.exit(1);
    }
}

runAuthTests();
