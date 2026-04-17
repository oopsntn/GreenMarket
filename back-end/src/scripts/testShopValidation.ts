import axios from "axios";

const API_URL = "http://localhost:5000/api";
const TEST_MOBILE = "0888888888";

async function testValidation() {
    console.log("🚀 Starting Shop Registration Validation Test...");

    try {
        // 1. Login
        console.log("\n1. Requesting OTP for login...");
        await axios.post(`${API_URL}/auth/user/request-otp`, { mobile: TEST_MOBILE });
        
        console.log("2. Verifying OTP...");
        const loginRes = await axios.post(`${API_URL}/auth/user/verify-otp`, { 
            mobile: TEST_MOBILE, 
            otp: "123456" 
        });
        const token = loginRes.data.token;
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Test Missing Name
        console.log("\n3. Testing registration with missing Name...");
        try {
            await axios.post(`${API_URL}/shops/register`, {
                shopLocation: "Test Location",
                shopDescription: "Test Description",
                shopLat: 10,
                shopLng: 10,
                shopLogoUrl: "logo.png",
                shopGalleryImages: ["img1.png", "img2.png", "img3.png"]
            }, authHeader);
        } catch (err: any) {
            console.log("✅ Caught expected error:", err.response?.data?.error);
        }

        // 3. Test Missing Images (min 3)
        console.log("\n4. Testing registration with only 2 images...");
        try {
            await axios.post(`${API_URL}/shops/register`, {
                shopName: "Test Shop",
                shopLocation: "Test Location",
                shopDescription: "Test Description",
                shopLat: 10,
                shopLng: 10,
                shopLogoUrl: "logo.png",
                shopGalleryImages: ["img1.png", "img2.png"]
            }, authHeader);
        } catch (err: any) {
            console.log("✅ Caught expected error:", err.response?.data?.error);
        }

        // 4. Test Missing Logo
        console.log("\n5. Testing registration with missing Logo...");
        try {
            await axios.post(`${API_URL}/shops/register`, {
                shopName: "Test Shop",
                shopLocation: "Test Location",
                shopDescription: "Test Description",
                shopLat: 10,
                shopLng: 10,
                shopGalleryImages: ["img1.png", "img2.png", "img3.png"]
            }, authHeader);
        } catch (err: any) {
            console.log("✅ Caught expected error:", err.response?.data?.error);
        }

        // 5. Test Missing Coordinates
        console.log("\n6. Testing registration with missing Lat/Lng...");
        try {
            await axios.post(`${API_URL}/shops/register`, {
                shopName: "Test Shop",
                shopLocation: "Test Location",
                shopDescription: "Test Description",
                shopLogoUrl: "logo.png",
                shopGalleryImages: ["img1.png", "img2.png", "img3.png"]
            }, authHeader);
        } catch (err: any) {
            console.log("✅ Caught expected error:", err.response?.data?.error);
        }

        console.log("\n✨ Validation Test Completed!");
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

testValidation();
