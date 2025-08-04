// server/src/db.js
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.ts';

console.log('📦 DATABASE_URL is:', process.env.DATABASE_URL);
// ————————————————
// derive __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// resolve your cert relative to this file
const caPath = path.resolve(__dirname, '../certs/rds-combined-ca-bundle.pem');

let caCert;
try {
  caCert = fs.readFileSync(caPath, 'utf8');
  console.log('🔒 Loaded RDS CA from', caPath);
} catch (err) {
  console.error('⚠️  Failed to load CA at', caPath, err.message);
  process.exit(1);
}

const pool = new Pool({
  // 📌 switch to explicit params or still use connectionString without sslmode
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: {
    ca:               caCert,
    rejectUnauthorized: true,
    minVersion:       'TLSv1.2',
  },
});

export const db = drizzle(pool, { schema });
export async function connectDB() {
  await pool.connect();
  console.log('🟢  Drizzle connected');
}
