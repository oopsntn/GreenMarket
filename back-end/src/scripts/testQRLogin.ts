import 'dotenv/config';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';

const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

async function testQRFlow() {
    console.log("=== Testing QR Login Flow ===");

    try {
        // Setup a mock mobile user
        let [testUser] = await db.select().from(users).where(eq(users.userMobile, '+84123123123'));
        
        if (!testUser) {
            const [newUser] = await db.insert(users).values({
                userMobile: '+84123123123',
                userDisplayName: 'QR Test Mobile User',
            }).returning();
            testUser = newUser as any;
        }

        const mobileToken = jwt.sign(
            { id: testUser.userId, mobile: testUser.userMobile, role: 'user' },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 1. Web requests a QR session
        console.log("\n[Web] Generating QR Session...");
        const generateRes = await axios.post(`${API_URL}/auth/qr/generate`);
        const sessionId = generateRes.data.sessionId;
        console.log("-> Session Generated:", sessionId);

        // 2. Web polls status (should be pending)
        console.log("\n[Web] Checking Status...");
        const statusRes1 = await axios.get(`${API_URL}/auth/qr/status/${sessionId}`);
        console.log("-> Status:", statusRes1.data.status); // Expected: pending

        // 3. Mobile scans the QR
        console.log("\n[Mobile] Scanning QR...");
        const scanRes = await axios.post(`${API_URL}/auth/qr/scan`, 
            { sessionId }, 
            { headers: { Authorization: `Bearer ${mobileToken}` } }
        );
        console.log("-> Scan Result:", scanRes.data.message);

        // 4. Web polls status (should be scanned)
        console.log("\n[Web] Checking Status again...");
        const statusRes2 = await axios.get(`${API_URL}/auth/qr/status/${sessionId}`);
        console.log("-> Status:", statusRes2.data.status); // Expected: scanned

        // 5. Mobile authorizes the login
        console.log("\n[Mobile] Authorizing Login...");
        const authRes = await axios.post(`${API_URL}/auth/qr/authorize`, 
            { sessionId }, 
            { headers: { Authorization: `Bearer ${mobileToken}` } }
        );
        console.log("-> Authorize Result:", authRes.data.message);

        // 6. Web polls status (should be authorized and return JWT)
        console.log("\n[Web] Checking Final Web Status...");
        const statusRes3 = await axios.get(`${API_URL}/auth/qr/status/${sessionId}`);
        console.log("-> Final Status:", statusRes3.data.status);
        console.log("-> Web JWT Token Received:", statusRes3.data.token ? "YES" : "NO");
        console.log("-> Logged In User:", statusRes3.data.user);

        console.log("\n=== TEST PASSED ===");

    } catch (error: any) {
        console.error("\n[ERROR] Test failed:", error.response?.data || error.message);
    }
}

testQRFlow();
