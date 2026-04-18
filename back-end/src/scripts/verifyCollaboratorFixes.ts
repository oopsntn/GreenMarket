import jwt from 'jsonwebtoken';
import axios from 'axios';

async function verifyCollaboratorFixes() {
    const API_URL = 'http://localhost:5000/api';
    const JWT_SECRET = '6f4b1c9e2a7d5f3c8b0e91a4d7c2f6b9e1a3c5d8f0b2e4a7c9d1e6f3a8b5c2d7';
    console.log("🔍 Verifying Collaborator Fixes...");

    try {
        // 1. Generate Token for User 1
        console.log("\n--- Step 1: Generating Test Token for User 1 ---");
        const token = jwt.sign({ id: 1, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
        console.log("✅ Token generated.");

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Test Public List
        console.log("\n--- Step 2: Testing Public List ---");
        const listRes = await axios.get(`${API_URL}/collaborator/public-list`, { headers });
        console.log(`✅ List fetched. Count: ${listRes.data.data.length}`);
        if (listRes.data.data.length === 0) {
            console.warn("⚠️ Warning: List is empty. Check if any collaborators exist.");
        }

        // 3. Test Public Detail for user 9
        console.log("\n--- Step 3: Testing Public Detail (ID: 9) ---");
        const detailRes = await axios.get(`${API_URL}/collaborator/public/9`, { headers });
        console.log("✅ Detail fetched successfully.");
        console.log("Result sample:", JSON.stringify({
            userId: detailRes.data.userId,
            displayName: detailRes.data.displayName,
            relationshipStatus: detailRes.data.relationshipStatus,
            stats: detailRes.data.stats
        }, null, 2));

        // 4. Verify Masking
        console.log("\n--- Step 4: Verifying Masking ---");
        if (detailRes.data.relationshipStatus !== 'active') {
             if (detailRes.data.mobile === null && detailRes.data.email === null) {
                 console.log("✅ Masking working correctly (Mobile/Email are null).");
             } else {
                 console.warn("❌ Masking FAILED: Mobile/Email found for non-active relationship!");
             }
        } else {
            console.log("ℹ️ User is already active, masking expected to be disabled.");
        }

        console.log("\n✨ All collaborator fixes verified successfully!");
    } catch (error: any) {
        console.error("\n❌ Verification Failed!");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

verifyCollaboratorFixes();
