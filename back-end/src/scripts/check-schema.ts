import "dotenv/config";
import pg from "pg";

async function diagnose() {
    const client = new pg.Client(process.env.DATABASE_URL);
    try {
        await client.connect();
        console.log("Connected to database.");

        // Check columns of promotion_packages
        const colsPkg = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'promotion_packages'
            ORDER BY ordinal_position;
        `);
        console.log("\n--- promotion_packages columns ---");
        console.table(colsPkg.rows);

        // Check columns of promotion_package_audit_log
        const colsAudit = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'promotion_package_audit_log'
            ORDER BY ordinal_position;
        `);
        console.log("\n--- promotion_package_audit_log columns ---");
        console.table(colsAudit.rows);

        // Check triggers
        const triggers = await client.query(`
            SELECT tgname, tgenabled, tgtype, proname as function_name
            FROM pg_trigger t
            JOIN pg_proc p ON t.tgfoid = p.oid
            WHERE tgrelid = 'promotion_packages'::regclass;
        `);
        console.log("\n--- Triggers on promotion_packages ---");
        console.table(triggers.rows);

    } catch (err: any) {
        console.error("DIAGNOSTIC ERROR:", err.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}

diagnose();
