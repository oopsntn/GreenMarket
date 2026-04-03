import axios from "axios";

const API_URL = "http://localhost:5000/api";
const TEST_MOBILE = "0978195419";
const TEST_EMAIL = "test-shop@example.com";
const NEW_PHONE = "0123456789";

async function testShopVerification() {
    console.log("🚀 Starting Shop Verification System Test...");

    try {
        // 1. Login to get token
        console.log("\n1. Requesting OTP for login...");
        await axios.post(`${API_URL}/auth/user/request-otp`, { mobile: TEST_MOBILE });
        
        console.log("2. Verifying OTP (using fixed mock 123456)...");
        const loginRes = await axios.post(`${API_URL}/auth/user/verify-otp`, { 
            mobile: TEST_MOBILE, 
            otp: "123456" 
        });
        const token = loginRes.data.token;
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };
        console.log("✅ Logged in successfully.");

        // 2. Get my shop (ensure it exists)
        console.log("\n3. Fetching shop details...");
        const shopRes = await axios.get(`${API_URL}/shops/my-shop`, authHeader);
        const shopId = shopRes.data.shopId;
        console.log(`✅ Shop found: ${shopRes.data.shopName} (Verified: ${shopRes.data.shopEmailVerified})`);

        // 3. Request Email OTP
        console.log(`\n4. Requesting OTP for Email: ${TEST_EMAIL}...`);
        await axios.post(`${API_URL}/shops/verify/request`, { 
            target: TEST_EMAIL, 
            type: "email" 
        }, authHeader);
        console.log("✅ OTP requested. Check server console/email logs.");

        // 4. Verify Email (Simulate with a mock/db check if needed, but here we require manual OTP entry if not mocked)
        // For testing, since we are in mock mode for OTP, we can check the verifications table if we had DB access here, 
        // but typically we'd print a prompt or just test the failure case.
        // Let's assume we know the mock OTP logic or just test the API existence.
        console.log("⚠️  Note: Real SMTP is active for Email. Verification requires the 6-digit code from your inbox.");

        // 5. Phone Management: Add new phone
        console.log(`\n5. Adding new phone: ${NEW_PHONE}...`);
        console.log("   5.1 Requesting OTP for Phone...");
        await axios.post(`${API_URL}/shops/verify/request`, { 
            target: NEW_PHONE, 
            type: "phone" 
        }, authHeader);
        
        console.log("   5.2 Verifying Phone OTP (using fixed mock 123456)...");
        const addPhoneRes = await axios.post(`${API_URL}/shops/phones`, {
            phone: NEW_PHONE,
            otp: "123456"
        }, authHeader);
        console.log("✅ Phone added:", addPhoneRes.data.shopPhone);

        // 6. Delete Phone
        console.log(`\n6. Deleting phone: ${NEW_PHONE}...`);
        const delPhoneRes = await axios.delete(`${API_URL}/shops/phones`, {
            ...authHeader,
            data: { phone: NEW_PHONE }
        });
        console.log("✅ Phone deleted:", delPhoneRes.data.shopPhone);
        console.log("✅ Security warning email should have been sent to shop email.");

        console.log("\n✨ Shop Verification System Test Completed!");
    } catch (error: any) {
        console.error("\n❌ Test failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Message:", error.message);
        }
    }
}

testShopVerification();
