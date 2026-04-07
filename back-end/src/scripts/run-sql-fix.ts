import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";

async function runFix() {
    const client = new pg.Client(process.env.DATABASE_URL);
    try {
        await client.connect();
        console.log("Connected to database.");

        const sqlFile = path.join(__dirname, "fix-promotion-schema.sql");
        const sql = fs.readFileSync(sqlFile, "utf8");

        console.log("Executing SQL fix...");
        await client.query(sql);
        console.log("✅ SQL fix executed successfully.");

    } catch (err: any) {
        console.error("❌ FIX FAILED:");
        console.error(err.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}

runFix();
