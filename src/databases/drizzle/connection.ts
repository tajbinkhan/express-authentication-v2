import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import schema from "@/databases/drizzle/schema";

dotenv.config();

// Create a connection pool for transactions
export const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL
});

// Create the db instance with the schema
const db = drizzle(pool, { schema });

export default db;
