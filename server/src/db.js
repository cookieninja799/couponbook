// server/src/db.js
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

// ————————————————
// derive __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// resolve your cert relative to this file
const caPath = path.resolve(__dirname, '/home/cookieninja/viva-spot-coupon-book/server/certs/global-bundle.pem');

let caCert;
try {
  caCert = fs.readFileSync(caPath, 'utf8');
  console.log('🔒 Loaded RDS CA from', caPath);
} catch (err) {
  console.error('⚠️  Failed to load CA at', caPath, err.message);
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: caCert,
  },
});

export const db = drizzle(pool, { schema });

export async function connectDB() {
  await pool.connect();
  console.log('🟢  Drizzle connected');
}
