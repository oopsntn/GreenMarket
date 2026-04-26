import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";
import * as schema from "../models/schema/index";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({ client: pool, schema });
