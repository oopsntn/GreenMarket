import "dotenv/config";
import pg from "pg";
import fs from "fs";

async function investigate() {
    const client = new pg.Client(process.env.DATABASE_URL);
    try {
        await client.connect();
        
        const res = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('promotion_packages', 'promotion_package_prices', 'v_promotion_package_current_price')
            ORDER BY table_name, ordinal_position;
        `);
        
        fs.writeFileSync("../tmp/schema_dump.json", JSON.stringify(res.rows, null, 2));
        console.log("Schema dump written to tmp/schema_dump.json");
    } catch (err: any) {
        console.error(err.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}

investigate();
