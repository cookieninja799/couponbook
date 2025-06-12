// server/src/db.js
import 'dotenv/config';
import { Pool }      from 'pg';
import { drizzle }   from 'drizzle-orm/node-postgres';
import * as schema   from './schema.js';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db   = drizzle(pool, { schema });

// (optional) warm-up connection so index.js stays identical
export async function connectDB () {
  await pool.connect();
  console.log('🟢  Drizzle connected');
}
